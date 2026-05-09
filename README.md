# EventControlSystem (ECS)

**开发者 / Developer:** Huafeirong  
**GitHub:** https://github.com/huarongfei/EventControlSystem  
**开源协议 / License:** MIT

---

大型体育比赛综合管理系统 — 集成导播控制、实时计分、赛况分析、移动裁判端于一体的五端协同平台。

🙌 **欢迎贡献！** 这是一个开源项目，热烈欢迎更多开发者参与开发。请访问 GitHub 提交 Issue 或 Pull Request。

## 系统架构

```
                           ┌─────────────────────────────────────────┐
                           │         Web 赛况分析面板                 │
                           │        (React + TailwindCSS)            │
                           └──────────────┬──────────────────────────┘
                                          │ HTTP / WebSocket
                           ┌──────────────▼──────────────────────────┐
                           │           Web 后端 (Node.js)             │
                           │     Express REST API + Socket.IO        │
                           │          端口: 3001                     │
                           └────┬──────────────┬──────────────┬───────┘
                                │              │              │
                    ┌───────────▼──┐  ┌──────▼─────┐  ┌───▼────────┐
                    │   SQLite DB   │  │  Windows   │  │  Android   │
                    │   (Prisma)    │  │计分裁判软件 │  │  裁判端    │
                    └───────────────┘  └─────────────┘  └────────────┘
                                      ┌─────────────┐
                                      │  Windows    │
                                      │  导播控制软件 │
                                      └─────────────┘
              ┌───────────────────────────────────────────────┐
              │          HarmonyOS 裁判端 (ArkTS)              │
              │   D:\EventControlSystem\refeerapp\           │
              └───────────────────────────────────────────────┘
```

## 五个端

| 端 | 技术栈 | 路径 |
|----|--------|------|
| **Web 后端** | Node.js + Express + TypeScript + Prisma + Socket.IO | `server/` |
| **Windows 计分裁判软件** | WPF + .NET 8.0 + CommunityToolkit.Mvvm | `windows/ScoringSystem/` |
| **Windows 导播控制软件** | WPF + .NET 8.0 + CommunityToolkit.Mvvm | `windows/BroadcastControl/` |
| **Android 裁判端** | Kotlin + Jetpack Compose + Material 3 | `android/RefereeApp/` |
| **HarmonyOS 裁判端** | ArkTS + ArkUI + HarmonyOS NEXT SDK 6.0.2 | `refeerapp/` |
| **Web 赛况分析面板** | React 18 + TypeScript + TailwindCSS + Vite | `web/AnalysisPanel/` |

---

## 快速开始

### 1. Web 后端

```bash
cd server

# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 推送数据库 Schema
npx prisma db push

# 开发模式（热重载）
npm run dev
```

后端运行在 `http://localhost:3001`

**完整 API 端点：**

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/events` | 赛事列表 |
| POST | `/api/events` | 创建赛事 |
| GET | `/api/events/:id` | 赛事详情 |
| DELETE | `/api/events/:id` | 删除赛事 |
| GET | `/api/events/:id/matches` | 赛事下的比赛列表 |
| GET | `/api/matches` | 全部比赛列表 |
| POST | `/api/matches` | 创建比赛 |
| GET | `/api/matches/:id` | 比赛基础信息 |
| GET | `/api/matches/:id/detail` | 比赛完整详情 |
| GET | `/api/matches/:id/statistics` | 比赛统计 |
| GET | `/api/matches/:id/export` | 导出数据 |
| PUT | `/api/matches/:id/score` | 更新比分 |
| PUT | `/api/matches/:id/status` | 更新比赛状态 |
| PUT | `/api/matches/:id` | 更新比赛信息 |
| DELETE | `/api/matches/:id` | 删除比赛 |
| POST | `/api/matches/:id/events` | 上报比赛事件 |
| GET | `/api/matches/:id/broadcast` | 获取导播场景 |
| PUT | `/api/matches/:id/broadcast` | 更新导播场景 |
| GET | `/api/teams` | 队伍列表 |
| POST | `/api/teams` | 创建队伍 |
| GET | `/api/teams/:id` | 队伍详情 |
| PUT | `/api/teams/:id` | 更新队伍 |
| DELETE | `/api/teams/:id` | 删除队伍 |
| GET | `/api/teams/:id/players` | 队伍球员列表 |
| POST | `/api/teams/:id/players` | 添加球员 |
| PUT | `/api/teams/players/:playerId` | 更新球员 |
| DELETE | `/api/teams/players/:playerId` | 删除球员 |
| GET | `/api/sports` | 运动类型列表 |
| POST | `/api/sync` | 离线事件批量同步 |
| WS | `/socket.io/` | WebSocket 实时通道 |

### 2. Windows 计分裁判软件

```bash
cd windows/ScoringSystem
dotnet build
dotnet run
```

启动后：
1. 输入后端服务器地址（如 `http://localhost:3001`）
2. 点击「连接」
3. 进入「比赛管理」创建/选择赛事和比赛
4. 开始计分

**快捷键：**
- `1/2/3` - 主队 +1/+2/+3 分
- `7/8/9` - 客队 +1/+2/+3 分
- `Space` - 开始/暂停计时
- `←/→` - 切换节次
- `F1` - 显示帮助

### 3. Windows 导播控制软件

```bash
cd windows/BroadcastControl
dotnet build
dotnet run
```

**快捷键：**
- `1-4` - 切换摄像机
- `C` - CUT 模式
- `A` - AUTO 模式
- `[/]` - 标记慢动作入/出点
- `F1` - 显示帮助

### 4. Android 裁判端

```bash
cd android/RefereeApp

# 首次设置：生成 Gradle Wrapper
gradle wrapper --gradle-version 8.5

# 构建 Debug APK
./gradlew assembleDebug

# 安装到设备
./gradlew installDebug
```

或在 Android Studio 中打开 `android/RefereeApp` 文件夹。

### 5. HarmonyOS 裁判端

```bash
# 用 DevEco Studio 打开项目
# D:\EventControlSystem\refeerapp\

# 运行或真机调试
```

SDK 要求：HarmonyOS NEXT 6.0.2(22)

### 6. Web 赛况分析面板

```bash
cd web/AnalysisPanel

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

面板运行在 `http://localhost:5173`（会自动代理 API 请求到 `:3001`）

---

## 种子数据

后端首次启动时会自动创建测试数据：

- **赛事**: 2026年上海市大学生篮球联赛
- **赛事 ID**: 43073d4e-4374-4d45-965c-3bb11d84651c
- **比赛**: 华东理工大学 vs 交通大学
- **比赛 ID**: 46a9f476-b050-4e88-84cc-0a44c16b7c03
- **比分**: 主队 45 - 38 客队（第 2 节，15:32）

---

## 实时同步

所有端通过 Socket.IO 保持实时同步：

| 事件 | 方向 | 描述 |
|------|------|------|
| `match:join` | 客户端→服务端 | 加入比赛房间 |
| `match:leave` | 客户端→服务端 | 离开比赛房间 |
| `timer:start` | 客户端→服务端 | 启动计时 |
| `timer:pause` | 客户端→服务端 | 暂停计时 |
| `timer:reset` | 客户端→服务端 | 重置计时 |
| `client:report` | 客户端→服务端 | 上报比赛事件 |
| `match:state` | 服务端→客户端 | 加入房间后推送当前状态 |
| `match:event` | 服务端→客户端 | 有新事件时广播 |
| `match:update` | 服务端→客户端 | 比赛状态变更 |
| `timer:tick` | 服务端→客户端 | 每秒推送计时 |
| `timer:ack` | 服务端→客户端 | 计时操作确认 |
| `broadcast:scene_change` | 服务端→客户端 | 导播场景切换 |
| `sync:ack` | 服务端→客户端 | 事件上报确认 |

---

## 项目结构

```
EventControlSystem/
├── server/                    # Web 后端
│   ├── src/
│   │   ├── index.ts         # 入口
│   │   ├── controllers/     # 控制器（event, match, team, sport, broadcast, sync）
│   │   ├── services/        # 业务逻辑
│   │   ├── repositories/    # 数据访问
│   │   ├── socket/          # WebSocket 处理
│   │   ├── middleware/      # 中间件
│   │   └── utils/           # 工具
│   ├── prisma/
│   │   └── schema.prisma    # 数据库模型（SQLite）
│   └── package.json
│
├── windows/
│   ├── ScoringSystem/       # 计分裁判软件
│   │   ├── Models/          # 数据模型
│   │   ├── ViewModels/      # MVVM ViewModel
│   │   ├── Views/           # XAML 视图
│   │   └── Services/        # ApiService + SocketService + BackendService
│   └── BroadcastControl/    # 导播控制软件
│
├── android/RefereeApp/       # Android 裁判端
│   └── app/src/main/java/
│       └── com/eventcontrol/refereeapp/
│           ├── ui/screens/   # Compose 界面
│           ├── viewmodel/    # ViewModel
│           ├── data/        # API + Socket + 本地
│           └── domain/       # 领域模型
│
├── refereapp/                 # HarmonyOS 裁判端 (ArkTS)
│   └── entry/src/main/ets/
│       ├── entryability/     # 入口
│       ├── model/            # MatchModels
│       ├── service/         # ApiService, SocketService, StorageService, OfflineQueue
│       ├── viewmodel/       # RefereeViewModel
│       ├── utils/          # DeviceInfo, NetworkMonitor
│       └── pages/           # Index, MainPage, SettingsPage, HistoryPage
│
└── web/AnalysisPanel/       # Web 赛况面板
    └── src/
        ├── components/      # React 组件
        ├── pages/          # 页面
        ├── hooks/          # 自定义 Hooks
        ├── services/       # API + Socket
        └── store/          # Zustand 状态管理
```

---

## 数据库

使用 SQLite（开发）/ PostgreSQL（生产），通过 Prisma ORM 管理。

```bash
# 创建迁移
npx prisma migrate dev --name init

# 推送 Schema（生产）
npx prisma db push

# 查看数据
npx prisma studio
```

---

## 技术亮点

- **实时同步**: WebSocket 广播 < 100ms 延迟
- **离线优先**: Android/HarmonyOS 端离线操作，网络恢复后自动同步
- **MVVM 架构**: Windows 端采用 CommunityToolkit.Mvvm
- **Clean Architecture**: Android 端分层清晰
- **响应式设计**: Web 面板 TailwindCSS + 深色主题
- **多端协同**: 赛况数据五端实时共享

---

## 开发状态

| 组件 | 状态 |
|------|------|
| 后端 TypeScript 编译 | ✅ 零错误 |
| Windows 计分软件 .NET 编译 | ✅ 零错误 |
| Windows 导播软件 .NET 编译 | ✅ 零错误 |
| Web 前端 Vite 构建 | ✅ 成功 |
| Android 项目 | ✅ 源码完整 |
| HarmonyOS 项目 | ✅ 源码完整 |
