# EventControlSystem — 整体系统架构

> 更新于 2026-05-02

---

## 一、系统概述

**EventControlSystem（ECS）** 是一套专为大型体育比赛设计的综合管理系统，采用五端协同架构，实现比赛现场的实时计分、导播控制、裁判操作与赛况分析。

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EventControlSystem                         │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────┤
│  Node.js 后端 │ Windows 计分 │ Windows 导播 │ Android 裁判 │ HarmonyOS│
│  (Express +  │ (WPF/.NET 8) │ (WPF/.NET 8) │ (Kotlin +    │ 裁判端  │
│   Socket.IO) │              │              │  Compose)    │ (ArkTS) │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴────┬────┘
       │              │              │              │            │
       └──────────────┴──────────────┴──────────────┴────────────┘
                              Node.js 后端为中心枢纽
                        Web 赛况分析面板（React）只读展示
```

---

## 二、各端功能定位

| 端 | 技术栈 | 主要功能 | 运行平台 |
|---|---|---|---|
| **后端服务** | Node.js + Express + TypeScript + Prisma + SQLite + Socket.IO | 数据存储/分发/WebSocket 推送 | 服务器 / PC |
| **计分裁判软件** | C# WPF + .NET 8 + CommunityToolkit.Mvvm | 主计时、手动改分、节次控制、赛事/比赛管理 | Windows |
| **导播控制软件** | C# WPF + .NET 8 | 摄像机切换、慢动作、特效叠加 | Windows |
| **Android 裁判端** | Kotlin + Jetpack Compose + Retrofit + Socket.IO | 事件上报（得分/犯规/换人等）| Android |
| **HarmonyOS 裁判端** | ArkTS + ArkUI + HarmonyOS NEXT SDK 6.0.2 | 同 Android，适配鸿蒙生态 | 手机/折叠屏/鸿蒙电脑 |
| **Web 赛况面板** | React 18 + TailwindCSS + Recharts + Zustand | 实时数据可视化，只读 | 浏览器 |

---

## 三、后端服务详解

### 3.1 技术规格

- **运行端口**：3001
- **框架**：Express + TypeScript
- **数据库**：SQLite（通过 Prisma ORM）
- **实时通信**：Socket.IO（WebSocket 心跳 10s / 超时 5s）
- **路由前缀**：`/api/`

### 3.2 REST API 路由表（完整）

```
GET    /api/health                         健康检查

GET    /api/events                          赛事列表
POST   /api/events                          创建赛事
GET    /api/events/:id                      赛事详情
DELETE /api/events/:id                      删除赛事
GET    /api/events/:id/matches              赛事下的比赛列表

GET    /api/matches                         全部比赛列表
POST   /api/matches                          创建比赛
GET    /api/matches/:id                     比赛基础信息
GET    /api/matches/:id/detail              比赛完整详情（含统计/走势）
GET    /api/matches/:id/statistics           比赛统计
GET    /api/matches/:id/export              导出（?format=json|csv）
GET    /api/matches/:id/broadcast           获取导播场景
PUT    /api/matches/:id/broadcast           更新导播场景
PUT    /api/matches/:id/score               更新比分
PUT    /api/matches/:id/status              更新比赛状态
PUT    /api/matches/:id                     更新比赛信息
DELETE /api/matches/:id                     删除比赛
POST   /api/matches/:id/events               上报比赛事件
GET    /api/matches/:id/participants         参赛者列表
POST   /api/matches/:id/participants         添加参赛者
PUT    /api/matches/:id/participants/:pid/time  更新参赛者成绩
GET    /api/matches/:id/race-results         田径比赛成绩

GET    /api/teams                            队伍列表
POST   /api/teams                            创建队伍
GET    /api/teams/:id                        队伍详情
PUT    /api/teams/:id                        更新队伍
DELETE /api/teams/:id                        删除队伍
GET    /api/teams/:id/players               队伍球员列表
POST   /api/teams/:id/players               添加球员
PUT    /api/teams/players/:playerId          更新球员
DELETE /api/teams/players/:playerId          删除球员

GET    /api/sports                           运动类型列表
GET    /api/sync                             获取同步状态
POST   /api/sync                             离线事件批量同步
```

### 3.3 Socket.IO 事件协议

#### 客户端 → 服务器

| 事件名 | 数据结构 | 说明 |
|---|---|---|
| `match:join` | `{ matchId: string }` | 加入比赛房间 |
| `match:leave` | `{ matchId: string }` | 离开比赛房间 |
| `timer:start` | `{ matchId: string }` | 启动/恢复计时 |
| `timer:pause` | `{ matchId: string }` | 暂停计时 |
| `timer:reset` | `{ matchId: string, period?: number }` | 重置计时 |
| `client:report` | 见下方 | 上报比赛事件 |

**`client:report` 数据结构：**
```json
{
  "matchId": "string",
  "type": "score | foul | sub | timeout | injury | quarter",
  "period": 1,
  "teamId": "string（可选）",
  "playerId": "string（可选）",
  "detail": {},
  "reportedBy": "string（可选，客户端标识）"
}
```

#### 服务器 → 客户端（推送）

| 事件名 | 数据结构 | 说明 |
|---|---|---|
| `match:state` | `{ match, broadcastScene }` | 加入房间后推送当前状态 |
| `match:event` | `{ event }` | 有新事件时广播给房间所有人 |
| `match:update` | `{ match }` | 比赛状态变更 |
| `timer:tick` | `{ matchId, remainingTime, period, status }` | 每秒推送计时 |
| `timer:ack` | `{ success, action, error? }` | 计时操作确认 |
| `broadcast:scene_change` | `{ matchId, scene }` | 导播场景变更 |
| `sync:ack` | `{ clientEventId, serverEventId, success, error? }` | 事件上报确认 |
| `error` | `{ message }` | 错误通知 |

### 3.4 数据库种子数据

```
赛事 ID：43073d4e-4374-4d45-965c-3bb11d84651c
比赛 ID：46a9f476-b050-4e88-84cc-0a44c16b7c03
主队：华东理工大学  客队：交通大学
```

---

## 四、Windows 计分裁判软件详解

### 4.1 项目路径
```
D:\EventControlSystem\windows\ScoringSystem\
```

### 4.2 已实现功能

| 功能 | 状态 |
|------|------|
| 服务器连接（WebSocket + HTTP） | ✅ |
| 赛事管理（创建、删除） | ✅ |
| 比赛管理（创建、删除、筛选） | ✅ |
| 双人实时计分界面 | ✅ |
| 运动员替换管理 | ✅ |
| 暂停/恢复比赛控制 | ✅ |
| 犯规/黄红牌记录 | ✅ |
| 选择球员加分 | ✅ |
| 选择犯规类型判罚 | ✅ |
| 局/节/盘管理 | ✅ |
| 比赛计时器 | ✅ |
| 实时数据同步状态显示 | ✅ |
| 事件日志记录 | ✅ |
| 键盘快捷键 | ✅ |
| 新手引导教程 | ✅ |
| 帮助系统 | ✅ |
| 设置界面一键启动后端+Web面板 | ✅ |
| 打印计分单 | ❌ |

### 4.3 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `1` | 主队 +1 分 |
| `2` | 主队 +2 分 |
| `3` | 主队 +3 分 |
| `7` | 客队 +1 分 |
| `8` | 客队 +2 分 |
| `9` | 客队 +3 分 |
| `Space` | 开始/暂停计时 |
| `←` | 上一节 |
| `→` | 下一节 |
| `F1` | 显示帮助 |

---

## 五、Windows 导播控制软件详解

### 5.1 项目路径
```
D:\EventControlSystem\windows\BroadcastControl\
```

### 5.2 已实现功能

| 功能 | 状态 |
|------|------|
| 多画面预览（1/2/4 分屏） | ✅ |
| 实时画面切换（CUT/Fade） | ✅ |
| 慢动作回放控制 | ✅ |
| 字幕/图文叠加 | ✅ |
| 导播场景预设保存/加载 | ✅ |
| 与计分软件联动 | ✅ |
| 虚拟摄像机驱动 | ✅ |
| 摄像机管理 | ✅ |
| 设置界面 | ✅ |
| 事件日志 | ✅ |
| 音频电平监测 | ❌ |
| 外部视频源接入（NDI/采集卡） | ❌ |

---

## 六、HarmonyOS 裁判端架构

### 6.1 项目位置

```
D:\EventControlSystem\refeerapp\
```

### 6.2 支持设备类型

| 设备 | module.json5 标识 |
|---|---|
| 手机 | `phone` |
| 平板 / 折叠屏展开态 | `tablet` |
| 鸿蒙电脑 / 2in1 | `2in1` |

### 6.3 目录结构

```
entry/src/main/ets/
├── entryability/
│   └── EntryAbility.ets           DevEco 生成，入口 Ability
├── model/
│   └── MatchModels.ets            数据模型定义
├── service/
│   ├── ApiService.ets             HTTP REST 请求
│   ├── SocketService.ets          WebSocket 实时连接
│   ├── StorageService.ets         Preferences 本地持久化
│   └── OfflineQueue.ets           离线事件缓存队列
├── viewmodel/
│   └── RefereeViewModel.ets       业务逻辑层（MVVM）
├── utils/
│   ├── DeviceInfo.ets             响应式断点工具
│   └── NetworkMonitor.ets          网络状态监控
└── pages/
    ├── Index.ets                   连接页面（服务器地址 + 比赛码）
    ├── MainPage.ets                裁判主控页面
    ├── SettingsPage.ets            设置页面
    └── HistoryPage.ets             历史比赛页面
```

### 6.4 响应式断点

| 断点 | 屏幕宽度 | 设备 | 布局 |
|---|---|---|---|
| SM | < 520vp | 小屏手机 | 单栏 Tab |
| MD | 520~840vp | 普通手机 | 单栏 Tab |
| LG | 840~1200vp | 折叠屏展开 / 平板 | 双栏 |
| XL | ≥ 1200vp | 鸿蒙电脑 | 双栏宽松 |

---

## 七、数据流图

```
裁判操作（得分/犯规等）
        │
        ▼
   HarmonyOS / Android 裁判端
   ┌────────────────────────┐
   │  页面（ArkUI/Compose）  │
   │    ↓                  │
   │  SocketService         │──── WebSocket ─────┐
   │  ApiService           │──── HTTP REST ─────┤
   │  OfflineQueue         │                    │
   └────────────────────────┘                    │
                                                  │ Socket.IO 广播
                                   ┌──────────────┤
                                   ▼              ▼
                             Windows 计分软件   Web 赛况面板
                             Windows 导播软件   Android 裁判端
                             其他已连接客户端
```

---

## 八、各端启动命令

```bash
# 后端（端口 3001）
cd d:/EventControlSystem/server
npm run dev

# Web 赛况面板（默认端口 5173）
cd d:/EventControlSystem/web/AnalysisPanel
npm run dev

# Windows 计分软件
cd d:/EventControlSystem/windows/ScoringSystem
dotnet run

# Windows 导播软件
cd d:/EventControlSystem/windows/BroadcastControl
dotnet run

# Android（Android Studio 打开 android/RefereeApp/）

# HarmonyOS（DevEco Studio 打开 D:\EventControlSystem\refeerapp）
```

---

## 九、关键环境信息

| 环境 | 版本 / 路径 |
|---|---|
| Node.js | 推荐 18+ |
| .NET SDK | C:/Program Files/dotnet/sdk/10.0.101 |
| JDK | F:/jdk-21.0.10.7-hotspot（Java 21） |
| DevEco Studio | NEXT，SDK 6.0.2 |
| HarmonyOS SDK | 6.0.2(22)，targetSdkVersion = "6.0.2(22)" |

---

## 十、构建状态总览

| 组件 | 编译状态 | 说明 |
|---|---|---|
| 后端 | ✅ TypeScript 零错误 | `npm run dev` |
| Windows 计分软件 | ✅ .NET 零错误 | `dotnet run` |
| Windows 导播软件 | ✅ .NET 零错误 | `dotnet run` |
| Web 前端 | ✅ Vite 构建成功 | `npm run dev` |
| Android | ✅ 源码完整 | Gradle 配置完成 |
| HarmonyOS | ✅ 源码完整 | DevEco 可导入 |
