# HarmonyOS 裁判端 — AI 开发指引

> 本文档专供开发 HarmonyOS 项目的 AI 阅读，包含规范、约束、当前状态与续写指引。

---

## 一、你需要知道的最重要的事

1. **本项目是 DevEco Studio NEXT 生成的正式工程**，不要修改 DevEco 生成的配置文件（`hvigorfile.ts`、`.idea/`、`oh-package-lock.json5`、`oh-package.json5`、`build-profile.json5` 等），只修改 `entry/src/main/ets/` 下的业务源码。
2. **使用 HarmonyOS NEXT API**（SDK 6.0.2），不要用旧版 API（如 `@ohos/net` 已废弃），统一使用 `@ohos.net.http` / `@ohos.net.webSocket` / `@kit.ArkData` 等新包。
3. **ArkTS 强类型**，禁止 `any`，所有数据结构需有 interface 定义。
4. **文件扩展名统一使用 `.ets`**，不要创建 `.ts` 文件放业务代码。
5. **如果 DevEco Studio 正在运行，直接用 PowerShell 写入文件**，避免 EBUSY 锁定错误。

---

## 二、项目路径

```
主项目根目录：D:\EventControlSystem\
HarmonyOS 裁判端：D:\EventControlSystem\refeerapp\
业务源码目录：D:\EventControlSystem\refeerapp\entry\src\main\ets\
```

---

## 三、当前文件结构（已完成）

```
entry/src/main/ets/
├── entryability/EntryAbility.ets     ✅ DevEco 生成，勿改
├── entrybackupability/...            ✅ DevEco 生成，勿改
├── model/
│   └── MatchModels.ets               ✅ 数据模型完整
├── service/
│   ├── ApiService.ets                ✅ HTTP 封装完整（get/put/post）
│   ├── SocketService.ets             ✅ WebSocket + 自动重连 + 心跳
│   ├── StorageService.ets            ✅ Preferences 持久化 + 历史记录
│   └── OfflineQueue.ets              ✅ 离线队列框架
├── viewmodel/
│   └── RefereeViewModel.ets          ✅ 业务逻辑 + 状态管理
├── utils/
│   ├── DeviceInfo.ets                ✅ 响应式断点工具
│   └── NetworkMonitor.ets            ✅ 网络状态监控
└── pages/
    ├── Index.ets                     ✅ 连接页面（扫码+历史+网络检测）
    ├── MainPage.ets                  ✅ 主控页面（计时+手势+弹窗）
    ├── SettingsPage.ets              ✅ 设置页面
    └── HistoryPage.ets               ✅ 历史比赛页面
```

---

## 四、后端对接规范

### 4.1 服务器信息

- **默认地址**：`http://localhost:3001`（本地调试时，真机需填局域网 IP）
- **WebSocket**：`ws://localhost:3001/socket.io/`

### 4.2 HarmonyOS 端连接后端的正确方式

#### HTTP 请求

```typescript
import http from '@ohos.net.http';

const httpUtil = http.createHttp();
const response = await httpUtil.request('http://192.168.x.x:3001/api/health', {
  method: http.RequestMethod.GET,
  connectTimeout: 10000,
  readTimeout: 10000,
  expectDataType: http.HttpDataType.OBJECT
});
// response.result 即为解析后的 JSON 对象
```

#### WebSocket 连接

```typescript
import webSocket from '@ohos.net.webSocket';

const ws = webSocket.createWebSocket();
ws.connect('ws://192.168.x.x:3001/socket.io/?EIO=4&transport=websocket');
ws.on('open', () => { /* 已连接 */ });
ws.on('message', (data: string) => { /* 处理消息 */ });
ws.on('close', () => { /* 断开 */ });
```

### 4.3 Socket.IO 事件（客户端 → 服务器）

裁判端需要发送的核心事件：

```typescript
// 加入比赛房间
{ "type": "match:join", "matchId": "..." }

// 上报比赛事件（得分/犯规/换人等）
{
  "type": "client:report",
  "matchId": "...",
  "eventType": "score",      // score | foul | sub | timeout | injury
  "period": 1,
  "teamId": "...",
  "playerId": "...",
  "detail": { "points": 2 }
}

// 计时控制
{ "type": "timer:start", "matchId": "..." }
{ "type": "timer:pause", "matchId": "..." }
```

### 4.4 关键 API 接口

```
# 赛事
GET    /api/events/:id                 获取赛事详情
DELETE /api/events/:id                 删除赛事

# 比赛
GET    /api/matches/:id/detail         获取比赛完整信息（页面加载时调用）
POST   /api/matches/:id/events         HTTP 方式上报事件（离线重连后同步用）

# 队伍
GET    /api/teams/:id                  获取队伍详情
GET    /api/teams/:id/players          获取队伍球员列表

# 其他
GET    /api/health                     连接测试
```

---

## 五、功能待实现清单

以下功能**全部已完成** ✅：

### 5.1 连接页面（Index.ets）✅ 已完成

- [x] 服务器地址 + 赛事码输入
- [x] 历史连接记录（下拉选择最近连接）
- [x] 网络状态检测（连接前 ping 服务器）
- [x] 加载动画与连接进度反馈
- [x] 网络状态实时监听（WiFi/移动数据/断网提示）

### 5.2 主控页面（MainPage.ets）✅ 已完成

- [x] 计时器显示与倒计时（监听 `timer:tick` Socket 事件）
- [x] 球员列表弹窗（点击「犯规」/「换人」时选择具体球员）
- [x] 手势确认机制（防止误操作，长按确认得分）
- [x] 事件撤销功能（最近一条事件可撤销）
- [x] 离线状态横幅提示（断网时显示警告，恢复后自动同步）
- [x] 节次切换控制（请求第二/三/四节）

### 5.3 ViewModel（RefereeViewModel.ets）✅ 已完成

- [x] 响应式写法（使用 @State + 监听器模式）
- [x] 离线重连后的事件批量同步逻辑
- [x] 比赛结束、数据统计等方法

### 5.4 新增页面 ✅ 已完成

- [x] **HistoryPage.ets** — 历史比赛列表，查看已完结比赛
- [x] **PlayerSelectDialog.ets** — 球员选择弹窗组件（已集成到 MainPage）
- [x] **SettingsPage.ets** — 设置页面（服务器地址管理）

### 5.5 权限配置

已在 `module.json5` 中添加 `ohos.permission.INTERNET`，真机调试时需确保已授权。

---

## 六、编写代码的规范要求

### 6.1 import 规范

```typescript
// ✅ 正确：使用 NEXT API
import http from '@ohos.net.http';
import webSocket from '@ohos.net.webSocket';
import { preferences } from '@kit.ArkData';
import router from '@kit.RouterKit';
import promptAction from '@ohos.promptAction';

// ❌ 错误：旧版或不存在的 API
import { fetch } from '@ohos/fetch';
import axios from 'axios';
```

### 6.2 ArkUI 组件规范

```typescript
// ✅ 页面必须有 @Entry @Component
@Entry
@Component
struct MyPage {
  @State someData: string = '';

  build() {
    Column() {
      Text(this.someData)
    }
  }
}

// ✅ 子组件用 @Component（无 @Entry）
@Component
struct MyWidget {
  build() { ... }
}

// ✅ @Builder 用于局部 UI 片段
@Builder
MySection() {
  Column() { ... }
}
```

### 6.3 响应式布局规范

```typescript
// 使用 DeviceInfo.ets 中的 ResponsiveLayout
import { ResponsiveLayout, Breakpoint } from '../utils/DeviceInfo';

@State isLargeScreen: boolean = false;

aboutToAppear() {
  this.isLargeScreen = ResponsiveLayout.isLargeScreen();
}

build() {
  if (this.isLargeScreen) {
    this.LargeLayout()
  } else {
    this.PhoneLayout()
  }
}
```

### 6.4 禁止事项

- 禁止在 `.ets` 文件中使用 `any` 类型
- 禁止直接操作 DOM（ArkUI 是声明式）
- 禁止使用 `setTimeout` 做轮询（改用 WebSocket 推送）
- 禁止在 `build()` 方法中调用异步函数（改用 `aboutToAppear` 或事件回调）

---

## 七、调试指引

### 真机调试注意事项

1. 手机和开发电脑必须在同一局域网
2. 服务器地址填局域网 IP，不能用 `localhost`，例如 `http://192.168.1.100:3001`
3. DevEco Studio → Run → 选择真机设备 → 点击 Run

### 模拟器调试

1. DevEco Studio → Device Manager → 创建模拟器
2. 选择对应设备类型（手机/折叠屏/PC）测试响应式布局

### 常见报错

| 错误 | 原因 | 解决 |
|---|---|---|
| `cannot find module '@ohos/...'` | 使用了旧版 API 路径 | 改为 `@ohos.net.http` 格式 |
| `INTERNET permission denied` | 未声明网络权限 | 检查 `module.json5` 的 `requestPermissions` |
| `build()` 报 async 错误 | build 内不能有 await | 用 `aboutToAppear` 或回调处理异步 |
| EBUSY 文件锁定 | DevEco 正在使用文件 | 用 PowerShell 写入 |

---

## 八、数据模型参考

所有类型定义在 `entry/src/main/ets/model/MatchModels.ets`：

```typescript
// 比赛状态
MatchStatus: pending | ongoing | paused | finished | cancelled

// 事件类型
EventType: score | foul | sub | timeout | injury | quarter

// 连接状态
ConnectionState: disconnected | connecting | connected | syncing | error | reconnecting

// 主要接口
MatchInfo { id, eventId, homeTeam: TeamInfo, awayTeam: TeamInfo,
            status, currentQuarter, quarterTime, maxQuarters }

TeamInfo { id, name, score, timeouts, fouls, players: PlayerInfo[] }

PlayerInfo { id, number, name, isOnCourt, points, fouls }

MatchEvent { id?, type, teamId?, playerId?, quarter, time,
             data?, timestamp, synced }

ReportEventRequest { type, teamId?, playerId?, quarter, time, data? }
```

---

## 九、与其他端的协作

HarmonyOS 裁判端与其他端**完全通过后端通信**，不直接调用其他端：

- 上报事件 → 后端存库 → Socket.IO 广播 → Windows 计分软件更新显示
- 服务器推送比分 → HarmonyOS 端实时更新
- Android 裁判端与 HarmonyOS 裁判端**功能等价**，可参考 Android 端的业务逻辑（`android/RefereeApp/`）

---

*本文档由 AI 自动生成并维护，如有变更请同步更新本文件。*
