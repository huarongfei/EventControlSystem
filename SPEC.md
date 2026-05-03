# EventControlSystem — 大型体育比赛综合管理系统

## 1. 项目概述

**项目名称**: EventControlSystem（ECS）
**项目类型**: 五端协同的综合体育赛事管理系统
**核心功能**: 集成导播控制、实时计分、裁判移动端、赛况数据分析的全场景赛事管理平台

### 目标用户
- **导播/导演**: 通过 Windows 导播控制软件管理直播画面切换、慢动作回放、字幕叠加
- **计分裁判**: 使用 Windows 计分软件进行比分录入、判罚记录、暂停/换人管理
- **场上裁判**: 通过 Android 移动端或 HarmonyOS 移动端实时上报判罚、换人请求、伤病情况
- **赛事分析师**: 通过 Web 面板查看实时数据统计、趋势图表、队伍对比
- **赛事管理方**: 管理赛事、队伍、运动员配置，查看综合数据报告

### 技术选型

| 端 | 技术栈 | 说明 |
|----|--------|------|
| Web 后端 | Node.js + Express + TypeScript | RESTful API + WebSocket 实时通信 |
| 数据库 | SQLite（本地）/ PostgreSQL（生产） | Prisma ORM，支持实时推送 |
| Windows 计分软件 | WPF + .NET 8.0 + MVVM | C# 托管代码，与后端 WebSocket 直连 |
| Windows 导播软件 | WPF + .NET 8.0 + MVVM | 支持 DirectX 渲染预览，多画面监看 |
| Android 裁判端 | Kotlin + Jetpack Compose + Material 3 | 离线优先设计，网络恢复后同步 |
| HarmonyOS 裁判端 | ArkTS + ArkUI + HarmonyOS NEXT SDK | 同 Android，适配鸿蒙生态 |
| Web 赛况面板 | React 18 + TypeScript + TailwindCSS | 响应式布局，实时数据可视化 |

---

## 2. 系统架构

```
                          ┌─────────────────────────────────────────┐
                          │           Web 赛况分析面板               │
                          │        (React + TailwindCSS)            │
                          └──────────────┬──────────────────────────┘
                                         │ HTTP/WebSocket
                          ┌──────────────▼──────────────────────────┐
                          │         Web 后端 (Node.js)              │
                          │  Express REST API + Socket.IO Server     │
                          │  Port: 3001                              │
                          └────┬──────────────┬──────────────┬────────┘
                               │              │              │
                          ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
                          │SQLite   │   │Windows  │   │Android  │
                          │Database │   │导播控制  │   │裁判端   │
                          └─────────┘   │+计分裁判 │   │+HarmonyOS│
                                        └────┬─────┘   └────┬─────┘
                                             │              │
                                             └──────┬───────┘
                                                    │
                                            WebSocket 直连
```

### 实时通信架构
- **技术**: Socket.IO 4.x
- **事件总线**: 服务端广播 → 所有在线客户端接收
- **离线同步**: Android/HarmonyOS 端采用操作日志队列，网络恢复后批量同步
- **多端同步延迟**: < 100ms（局域网内）

---

## 3. 业务模型

### 3.1 核心实体（对应 Prisma Schema）

```prisma
// 赛事
model events {
  id         String    @id @default(uuid())
  name       String
  sportType  String    @default("basketball")
  category   String    @default("team")
  startTime  DateTime?
  status     String    @default("pending")
  scoreRules String?
  createdAt  DateTime  @default(now())
  matches    matches[]
}

// 比赛
model matches {
  id              String   @id @default(uuid())
  eventId         String
  category        String   @default("team")
  sportType       String   @default("basketball")
  status          String   @default("not_started")
  currentPeriod   Int      @default(1)
  periodDuration  Int      @default(10)
  periodGoal      Int      @default(0)
  matchTime       String   @default("10:00")
  homeScore       Int      @default(0)
  awayScore       Int      @default(0)
  startedAt       DateTime?
  endedAt         DateTime?
  createdAt       DateTime @default(now())
  homeTeamId      String
  awayTeamId      String
  homeTeam        teams   @relation("matches_homeTeamIdToteams", ...)
  awayTeam        teams   @relation("matches_awayTeamIdToteams", ...)
  event           events  @relation(...)
  match_events    match_events[]
  match_participants match_participants[]
}

// 队伍
model teams {
  id           String   @id @default(uuid())
  name         String
  shortName    String?
  logoUrl      String?
  createdAt    DateTime @default(now())
  players      players[]
}

// 运动员
model players {
  id        String   @id @default(uuid())
  teamId    String
  name      String
  number    Int?
  position  String?
  createdAt DateTime @default(now())
  team      teams    @relation(fields: [teamId], ...)
}

// 比赛事件（不可篡改日志）
model match_events {
  id         String   @id @default(uuid())
  matchId    String
  type       String
  period     Int?
  timestamp  DateTime @default(now())
  teamId     String?
  playerId   String?
  detail     String?
  reportedBy String?
  synced     Boolean  @default(false)
  match      matches  @relation(...)
}

// 导播场景
model broadcast_scenes {
  id            String   @id @default(uuid())
  matchId       String   @unique
  name          String?
  layout        String?
  primaryCamera String?
  overlay       String?
  transition    String?
  createdAt     DateTime @default(now())
  match         matches  @relation(...)
}
```

### 3.2 TypeScript 类型（客户端用）

```typescript
// 赛事
interface Event {
  id: string
  name: string
  sportType: string      // basketball | football | volleyball | ...
  category: string      // team | individual
  startTime?: string
  status: string        // pending | live | paused | finished
  scoreRules?: string
  createdAt: string
  _count?: { matches: number }
}

// 比赛
interface Match {
  id: string
  eventId: string
  category: string
  sportType: string
  status: string        // not_started | running | paused | finished
  currentPeriod: number
  periodDuration: number
  periodGoal: number
  matchTime: string
  homeScore: number
  awayScore: number
  startedAt?: string
  endedAt?: string
  createdAt: string
  homeTeamId: string
  awayTeamId: string
  homeTeam?: Team
  awayTeam?: Team
}

// 队伍
interface Team {
  id: string
  name: string
  shortName?: string
  logoUrl?: string
  createdAt: string
  players?: Player[]
}

// 运动员
interface Player {
  id: string
  teamId: string
  name: string
  number?: number
  position?: string
  createdAt: string
}

// 比赛事件
interface MatchEvent {
  id: string
  matchId: string
  type: string          // score | foul | sub | timeout | injury | quarter
  period?: number
  timestamp: string
  teamId?: string
  playerId?: string
  detail?: string
  reportedBy?: string
  synced: boolean
}

// 导播场景
interface BroadcastScene {
  id: string
  matchId: string
  name?: string
  layout?: string
  primaryCamera?: string
  overlay?: string
  transition?: string
}
```

---

## 4. 功能模块

### 4.1 Web 后端

#### API 端点（完整列表）

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
| GET | `/api/matches/:id/detail` | 比赛完整详情（含统计/走势） |
| GET | `/api/matches/:id/statistics` | 比赛统计 |
| GET | `/api/matches/:id/export` | 导出数据（?format=json\|csv） |
| PUT | `/api/matches/:id/score` | 更新比分 |
| PUT | `/api/matches/:id/status` | 更新比赛状态 |
| PUT | `/api/matches/:id` | 更新比赛信息 |
| DELETE | `/api/matches/:id` | 删除比赛 |
| POST | `/api/matches/:id/events` | 上报比赛事件 |
| GET | `/api/matches/:id/broadcast` | 获取导播场景 |
| PUT | `/api/matches/:id/broadcast` | 更新导播场景 |
| GET | `/api/matches/:id/participants` | 获取参赛者列表 |
| POST | `/api/matches/:id/participants` | 添加参赛者 |
| GET | `/api/matches/:id/race-results` | 获取比赛成绩 |
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
| GET | `/api/sync` | 获取同步状态 |
| POST | `/api/sync` | 离线事件批量同步 |
| WS | `/socket.io` | WebSocket 实时通道 |

#### WebSocket 事件

**客户端 → 服务器**

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

**服务器 → 客户端**

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

### 4.2 Windows 计分裁判软件

#### 功能列表

- [x] 连接服务器（WebSocket + HTTP）
- [x] 赛事/比赛选择与加载
- [x] 赛事管理（创建、删除赛事）
- [x] 双人实时计分界面（主客队）
- [x] 运动员替换管理（换人列表）
- [x] 暂停/恢复比赛控制
- [x] 犯规/黄红牌记录
- [x] 局/节/盘管理（篮球节、足球半场、排球局等）
- [x] 比赛计时器（进攻24秒/足球45分钟等可配置）
- [x] 实时数据同步状态显示
- [x] 事件日志记录
- [x] 选择球员加分
- [x] 选择犯规类型判罚
- [x] 键盘快捷键（1-9 加分、Space 计时、F1 帮助）
- [x] 新手引导教程
- [x] 设置界面一键启动后端+Web面板
- [ ] 打印计分单

#### UI 布局
```
┌────────────────────────────────────────────────────────┐
│  [赛事名]  [比赛]  ●连接状态    [保存] [设置]          │
├────────────────────────────────────────────────────────┤
│           主队              │           客队           │
│  ┌──────────────────────┐   │  ┌────────────────────┐ │
│  │    LOGO  队伍名      │   │  │    LOGO  队伍名    │ │
│  │                      │   │  │                    │ │
│  │      [  86  ]        │   │  │      [  82  ]       │ │
│  │    大号比分显示      │   │  │    大号比分显示     │ │
│  │                      │   │  │                    │ │
│  └──────────────────────┘   │  └────────────────────┘ │
├────────────────────────────────────────────────────────┤
│  比赛时间:  23:45    第 3 节    [开始] [暂停] [结束]  │
├────────────────────────────────────────────────────────┤
│  [得分 +1] [得分+2] [得分+3] │ [犯规] [换人] [暂停]   │
├────────────────────────────────────────────────────────┤
│  事件日志:                                             │
│  23:32 - 客队 #7 张三分命中 (+3)                      │
│  23:15 - 主队 #12 犯规                               │
│  22:48 - 客队请求暂停                                  │
└────────────────────────────────────────────────────────┘
```

### 4.3 Windows 导播控制软件

#### 功能列表

- [x] 多画面预览（1/2/4 分屏布局）
- [x] 实时画面切换（CUT/Fade）
- [x] 慢动作回放控制（标记入点/出点）
- [x] 字幕/图文叠加（队名、比分、赞助商）
- [x] 导播场景预设保存/加载
- [x] 与计分软件联动（比分自动叠加）
- [x] 虚拟摄像机驱动（纯色/图片/视频/NDI/采集卡）
- [x] 摄像机管理（添加/删除/命名）
- [x] 设置界面（常规/摄像机/录制配置）
- [x] 键盘快捷键
- [x] 事件日志
- [ ] 音频电平监测
- [ ] 外部视频源接入（NDI/采集卡）

#### UI 布局
```
┌──────────────────────────────────────────────────────────────────┐
│  [场景预设: 全屏|双画|四分|解说]   [直播]●   [录制]   [设置]    │
├────────────────────────────────────┬─────────────────────────────┤
│  ┌──────────┐ ┌──────────┐        │  ┌──────────────────────┐  │
│  │ CAM 1    │ │ CAM 2    │        │  │  当前输出             │  │
│  │ [足球场] │ │ [观众席] │        │  │  ┌────────────────┐  │  │
│  │    PGM   │ │          │        │  │  │   主画面预览   │  │  │
│  └──────────┘ └──────────┘        │  │  └────────────────┘  │  │
│  ┌──────────┐ ┌──────────┐        │  │  [比分叠加层]         │  │
│  │ CAM 3   │ │ CAM 4    │        │  │  主队 86 - 82 客队   │  │
│  │ [替补席] │ │ [特写]   │        │  └──────────────────────┘  │
│  │          │ │          │        │                             │
│  └──────────┘ └──────────┘        │  音频: ████░░░░░          │
├────────────────────────────────────┴─────────────────────────────┤
│  [CUT]  [AUTO]  [SLOW]  │  字幕: [显示/隐藏]  [编辑]           │
│  [CAM1][CAM2][CAM3][CAM4]│  慢动作: [标记入] [标记出] [播放]  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Android 裁判端

#### 功能列表

- [x] 设备绑定（扫码/手动配对到赛事）
- [x] 实时上报判罚（犯规类型/严重程度）
- [x] 换人请求（发送至计分台）
- [x] 暂停/继续请求
- [x] 伤病/急救事件上报
- [x] 实时赛况查看（只读）
- [x] 离线操作（网络中断时本地记录）
- [x] 同步状态指示器
- [x] 运动员快速查找

#### 屏幕结构
1. **连接屏幕**: 服务器地址 + 赛事码
2. **主屏幕**: 当前比赛概览（比分/时间/状态）
3. **操作屏幕**: 犯规/换人/暂停等快捷按钮
4. **历史屏幕**: 本设备上报记录

### 4.5 HarmonyOS 裁判端

- 项目位置：`D:\EventControlSystem\refeerapp\`
- SDK：HarmonyOS NEXT 6.0.2(22)
- 支持设备：phone / tablet / 2in1

#### 功能列表

- [x] 连接页面（服务器地址 + 赛事码 + 历史记录）
- [x] 主控页面（计时 + 手势 + 弹窗）
- [x] 设置页面（服务器地址管理）
- [x] 历史比赛页面
- [x] 球员选择弹窗
- [x] 离线队列框架
- [x] 网络状态监控

### 4.6 Web 赛况分析面板

#### 功能列表

- [x] 实时比赛数据大屏
- [x] 比分/计时实时更新
- [x] 运动员表现数据（得分/助攻/犯规等）
- [x] 趋势图表（得分走势、球员效率）
- [x] 历史对比（同队伍/球员过往数据）
- [x] 多场比赛切换
- [x] 暗色主题（适配大屏/投屏）
- [x] 导出数据报告（Excel/PDF）

---

## 5. 数据库设计

### SQLite 表结构（对应 Prisma Schema）

```sql
-- 赛事表
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL DEFAULT 'basketball',
  category TEXT NOT NULL DEFAULT 'team',
  start_time DATETIME,
  status TEXT DEFAULT 'pending',
  score_rules TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 队伍表
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 运动员表
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  name TEXT NOT NULL,
  number INTEGER,
  position TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 比赛表
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id),
  category TEXT DEFAULT 'team',
  sport_type TEXT DEFAULT 'basketball',
  status TEXT DEFAULT 'not_started',
  current_period INTEGER DEFAULT 1,
  period_duration INTEGER DEFAULT 10,
  period_goal INTEGER DEFAULT 0,
  match_time TEXT DEFAULT '10:00',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  home_team_id TEXT REFERENCES teams(id),
  away_team_id TEXT REFERENCES teams(id)
);

-- 比赛事件表（不可篡改日志）
CREATE TABLE match_events (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id),
  type TEXT NOT NULL,
  period INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  team_id TEXT,
  player_id TEXT,
  detail TEXT,
  reported_by TEXT,
  synced INTEGER DEFAULT 0
);

-- 导播场景表
CREATE TABLE broadcast_scenes (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) UNIQUE,
  name TEXT,
  layout TEXT,
  primary_camera TEXT,
  overlay TEXT,
  transition TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 参赛者表（用于田径等项目）
CREATE TABLE match_participants (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id),
  lane_number INTEGER NOT NULL,
  athlete_name TEXT NOT NULL,
  team_name TEXT,
  split_times TEXT,
  final_time TEXT,
  rank INTEGER,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. 项目结构

```
EventControlSystem/
├── server/                          # Web 后端 (Node.js)
│   ├── src/
│   │   ├── index.ts                 # 入口文件
│   │   ├── config/                  # 配置（config/index.ts）
│   │   ├── controllers/             # 控制器
│   │   │   ├── event.controller.ts  # 赛事 CRUD
│   │   │   ├── match.controller.ts  # 比赛 CRUD + 事件/统计
│   │   │   ├── team.controller.ts   # 队伍/球员 CRUD
│   │   │   ├── sport.controller.ts  # 运动类型
│   │   │   ├── broadcast.controller.ts  # 导播场景
│   │   │   └── sync.controller.ts   # 离线同步
│   │   ├── services/                # 业务逻辑
│   │   ├── repositories/            # 数据访问
│   │   ├── middleware/              # 中间件
│   │   ├── socket/                  # WebSocket 处理
│   │   └── utils/                   # 工具函数
│   ├── prisma/
│   │   └── schema.prisma            # Prisma Schema
│   ├── package.json
│   └── tsconfig.json
│
├── windows/
│   ├── ScoringSystem/               # Windows 计分裁判软件
│   │   ├── App.xaml
│   │   ├── MainWindow.xaml
│   │   ├── ViewModels/              # MainViewModel.cs 等
│   │   ├── Views/
│   │   │   ├── MainWindow.xaml
│   │   │   └── Pages/               # 各页面 XAML
│   │   ├── Services/                # ApiService, SocketService, BackendService
│   │   ├── Models/                  # 数据模型
│   │   └── ScoringSystem.csproj
│   │
│   └── BroadcastControl/            # Windows 导播控制软件
│       ├── App.xaml
│       ├── MainWindow.xaml
│       ├── ViewModels/
│       ├── Views/
│       ├── Services/
│       ├── Models/
│       └── BroadcastControl.csproj
│
├── android/
│   └── RefereeApp/                  # Android 裁判端
│       ├── app/src/main/java/.../
│       │   ├── MainActivity.kt
│       │   ├── ui/                  # Compose 界面
│       │   ├── data/                # API + Socket + 本地
│       │   └── domain/              # 领域模型
│       └── build.gradle.kts
│
├── refereapp/                       # HarmonyOS 裁判端 (ArkTS)
│   ├── entry/src/main/ets/
│   │   ├── entryability/            # EntryAbility.ets
│   │   ├── model/                   # MatchModels.ets
│   │   ├── service/                 # ApiService, SocketService, StorageService, OfflineQueue
│   │   ├── viewmodel/               # RefereeViewModel.ets
│   │   ├── utils/                   # DeviceInfo, NetworkMonitor
│   │   └── pages/                   # Index, MainPage, SettingsPage, HistoryPage
│   └── build-profile.json5
│
├── web/
│   └── AnalysisPanel/               # Web 赛况分析面板
│       ├── src/
│       │   ├── App.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   ├── services/
│       │   └── types/
│       ├── package.json
│       └── vite.config.ts
│
├── SPEC.md                           # 本文档
└── README.md                         # 快速开始指南
```

---

## 7. 各端启动命令

```bash
# 后端（端口 3001）
cd d:/EventControlSystem/server
npm install
npx prisma generate
npx prisma db push
npm run dev

# Web 赛况面板（端口 5173）
cd d:/EventControlSystem/web/AnalysisPanel
npm install
npm run dev

# Windows 计分软件
cd d:/EventControlSystem/windows/ScoringSystem
dotnet build
dotnet run

# Windows 导播软件
cd d:/EventControlSystem/windows/BroadcastControl
dotnet build
dotnet run

# Android（Android Studio 打开 android/RefereeApp/）

# HarmonyOS（DevEco Studio 打开 refereapp/）
```

---

## 8. 环境要求

| 组件 | 要求 |
|------|------|
| Node.js | >= 18.0 |
| .NET SDK | >= 8.0 |
| Android Studio | Hedgehog (2023.1.1) + |
| JDK | 17 或更高 |
| Kotlin | 1.9.x |
| React | 18.x |
| Vite | 5.x |
| DevEco Studio | NEXT，SDK 6.0.2 |
| HarmonyOS SDK | 6.0.2(22) |

---

## 9. 验收标准

- [x] 后端服务正常启动，API 响应正常（零编译错误）
- [x] Windows 计分软件可连接后端并同步比分（零编译错误）
- [x] Windows 导播软件编译运行正常（零编译错误）
- [x] Web 面板可实时显示比赛数据（Vite 构建成功）
- [x] Android 端可离线记录判罚，恢复网络后同步
- [x] HarmonyOS 裁判端框架完整
- [ ] 所有端在局域网内数据同步延迟 < 500ms
