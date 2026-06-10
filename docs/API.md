# EventControlSystem API 文档

## 概述

EventControlSystem 后端提供 RESTful API 和 Socket.IO 实时通信接口，用于管理体育比赛的各个方面。

**基础 URL**: `http://localhost:3001`
**Socket.IO**: `http://localhost:3001/socket.io`（使用 Engine.IO 轮询或 WebSocket 传输）

> **注意**: 所有 API 响应直接返回数据对象，**不使用** `{ success, data }` 包装格式。错误响应返回 `{ code, message, statusCode }` 格式。

---

## 认证

当前版本无需认证（v1 阶段）。生产环境部署时建议添加 JWT 或 API Key 认证。

速率限制：100 次/15 分钟（按 IP）。

---

## 常用状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误（验证失败） |
| 404 | 资源不存在 |
| 422 | 请求参数格式正确但语义无效 |
| 500 | 服务器内部错误 |

---

## 健康检查

```
GET /api/health
```

**响应**:
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "timestamp": "2026-06-10T08:00:00.000Z",
  "dbStatus": "connected",
  "version": "1.0.0"
}
```

---

## 比赛管理 API

### 获取比赛列表

```
GET /api/matches
```

**查询参数**:
- `eventId` (string, 可选): 筛选指定赛事下的比赛

**响应** — 返回数组（非包装格式）:
```json
[
  {
    "id": "46a9f476-b050-4e88-84cc-0a44c16b7c03",
    "event_id": "43073d4e-4374-4d45-965c-3bb11d84651c",
    "event_name": "2026年上海市大学生篮球联赛",
    "home_team": { "id": "team-001", "name": "华东理工大学", "short_name": "华理", "logo": null },
    "away_team": { "id": "team-002", "name": "交通大学", "short_name": "交大", "logo": null },
    "home_score": 45,
    "away_score": 38,
    "status": "live",
    "current_period": 2,
    "total_periods": 4,
    "period_label": "第2节",
    "game_clock": "07:32",
    "start_time": "2026-04-19T14:00:00.000Z",
    "sport_type": "basketball",
    "category": "team",
    "sport_emoji": "🏀"
  }
]
```

> **状态值说明** (`mapStatus` 映射): `upcoming`(未开始) → `live`(进行中) → `paused`(暂停) → `finished`(已结束)

### 创建比赛

```
POST /api/matches
```

**请求体** (Zod `createMatchSchema` 校验):
```json
{
  "eventId": "43073d4e-4374-4d45-965c-3bb11d84651c",
  "homeTeamId": "team-001",
  "awayTeamId": "team-002",
  "category": "team",
  "sportType": "basketball",
  "status": "not_started",
  "periodDuration": 10,
  "matchTime": "10:00"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `eventId` | string(UUID) | ✅ | 所属赛事 ID |
| `homeTeamId` | string(UUID) | ✅ | 主队 ID |
| `awayTeamId` | string(UUID) | ✅ | 客队 ID |
| `category` | enum | ❌ | `team`(对战) 或 `race`(竞速)，默认从赛事继承 |
| `sportType` | string | ❌ | 运动类型，默认从赛事继承 |
| `status` | enum | ❌ | `not_started`/`running`/`paused`/`finished` |
| `periodDuration` | number | ❌ | 每节时长(分钟)，默认 10 |
| `matchTime` | string | ❌ | 初始时间，格式 `MM:SS` |

**响应**: 新创建的比赛对象

### 获取比赛详情

```
GET /api/matches/:id/detail
```

返回完整比赛数据，包含球员统计、事件列表、走势数据。

**A类（team）响应字段**:
```json
{
  "id": "...",
  "category": "team",
  "sportType": "basketball",
  "homeTeam": { "id": "...", "name": "...", "short_name": "...", "logo": null },
  "awayTeam": { "id": "...", "name": "...", "short_name": "...", "logo": null },
  "homeStats": { "teamId": "...", "score": 45, "team": {...}, "得分": ..., "犯规": ... },
  "awayStats": { "teamId": "...", "score": 38, "team": {...}, "得分": ..., "犯规": ... },
  "homePlayers": [{ "playerId": "...", "player": {...}, "得分": 12, "三分命中": 3, "犯规": 2 }],
  "awayPlayers": [...],
  "events": [
    { "id": "...", "matchId": "...", "teamId": "...", "playerId": "...", "eventType": "score", "quarter": 2, "timestamp": "...", "gameClock": "07:30", "description": "得分 +2", "points": 2 }
  ],
  "scoreTrend": [{ "gameClock": "00:00", "homeScore": 0, "awayScore": 0, "period": 1 }, ...],
  "status": "live",
  "currentPeriod": 2,
  "periodLabel": "第2节",
  "gameClock": "07:32",
  "startTime": "2026-04-19T14:00:00.000Z"
}
```

### 更新比分

```
PUT /api/matches/:id/score
```

**请求体**:
```json
{
  "homeScore": 46,
  "awayScore": 38,
  "period": 2,
  "matchTime": "07:28"
}
```

### 更新比赛状态

```
PUT /api/matches/:id/status
```

**请求体**:
```json
{ "status": "paused" }
```

**有效状态值**: `not_started` | `running` | `paused` | `finished`

> 注意：没有 `pending` 或 `cancelled` 状态。状态变更会自动触发计时器服务（启动/暂停/停止）。

### 上报比赛事件

```
POST /api/matches/:id/events
```

**请求体** (Zod `addEventSchema` 校验):
```json
{
  "type": "score",
  "teamId": "team-001",
  "playerId": "player-001",
  "period": 2,
  "detail": { "points": 3 },
  "reportedBy": "referee-app"
}
```

**支持的事件类型** (`ALL_EVENT_TYPES`):

| type | 说明 | 适用运动 |
|------|------|----------|
| `score` | 得分 | 全部 |
| `foul` | 犯规 | 全部 |
| `substitution` | 换人 | team 类 |
| `timeout` | 暂停请求 | team 类 |
| `injury` | 伤病 | 全部 |
| `yellow_card` | 黄牌 | football |
| `red_card` | 红牌 | football/volleyball |
| `corner_kick` | 角球 | football |
| `offside` | 越位 | football |
| `side_change` | 换边 | tennis/table_tennis/badminton |
| `finish` | 完赛 | race 类 |
| `dq` | 取消资格 | race 类 |
| `withdraw` | 退赛 | race 类 |

### 删除比赛

```
DELETE /api/matches/:id
```

### 导出比赛数据

```
GET /api/matches/:id/export?format=json
GET /api/matches/:id/export?format=csv
```

---

## 队伍管理 API

队伍 CRUD 操作通过 Team Controller 提供。

### 获取队伍列表
```
GET /api/teams
```

### 创建队伍
```
POST /api/teams
```
**请求体**: `{ "name": "华东理工大学", "shortName": "华理", "logoUrl": "https://..." }`

### 获取队伍详情
```
GET /api/teams/:id
```

### 更新队伍
```
PUT /api/teams/:id
```

### 删除队伍
```
DELETE /api/teams/:id
```

### 获取队伍球员
```
GET /api/teams/:id/players
```

### 添加球员
```
POST /api/teams/:id/players
```
**请求体**: `{ "name": "张三", "number": 10, "position": "PG" }`

---

## 导播场景 API

### 获取当前导播场景
```
GET /api/matches/:id/broadcast
```

### 更新导播场景
```
PUT /api/matches/:id/broadcast
```
**请求体**:
```json
{
  "name": "主视角",
  "layout": "single",
  "primaryCamera": "camera_1",
  "overlay": { "showScore": true, "showTimer": true },
  "transition": "cut"
}
```

| 字段 | 类型 | 可选值 |
|------|------|--------|
| `layout` | enum | `single`, `dual`, `quad`, `scoreboard` |
| `transition` | enum | `cut`, `fade`, `wipe` |

---

## 犯规类型 API

### 获取犯规类型列表
```
GET /api/foul-types
GET /api/foul-types?sportType=basketball
```

**响应**: 返回数组（非包装），每项包含 `id`, `sportType`, `code`, `name`, `nameEn`, `severity`, `penalty`, `description`。

**严重程度**: `minor`(轻微) | `common`(普通) | `severe`(严重) | `dangerous`(危险)

---

## 错误响应格式

所有错误统一返回 `AppError` 格式：

```json
{
  "code": "MATCH_NOT_FOUND",
  "message": "Match with id xxx not found",
  "statusCode": 404
}
```

**错误代码一览**:

| HTTP Code | Error Code | 说明 |
|-----------|------------|------|
| 400 | `BAD_REQUEST` / `VALIDATION_ERROR` | 参数验证失败（含详细字段级错误信息） |
| 404 | `MATCH_NOT_FOUND` / `EVENT_NOT_FOUND` / `TEAM_NOT_FOUND` | 资源不存在 |
| 422 | `UNPROCESSABLE_ENTITY` | 参数格式正确但语义无效（如非法 UUID） |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

---

## Socket.IO 事件

### 连接与房间

```javascript
// 连接（自动获得 sid）
const socket = io('http://localhost:3001');

// 加入比赛房间（必须先 join 才能收发该比赛的实时数据）
socket.emit('match:join', { matchId: '46a9f476-...' });

// 离开比赛房间
socket.emit('match:leave', { matchId: '46a9f476-...' });
```

### 客户端 → 服务端（emit）

| 事件名 | Payload Schema | 说明 |
|--------|---------------|------|
| `timer:start` | `{ matchId: UUID }` | 启动/恢复计时器（自动设 status=running） |
| `timer:pause` | `{ matchId: UUID }` | 暂停计时器（自动设 status=paused） |
| `timer:reset` | `{ matchId: UUID, period?: number }` | 重置计时到指定节初始时间 |
| `client:report` | `{ matchId, type, teamId?, playerId?, period?, detail? }` | 裁判端上报事件 |

### 服务端 → 客户端（on）

| 事件名 | 数据结构 | 说明 |
|--------|----------|------|
| `match:clock` | `{ matchId, remainingSeconds, elapsedSeconds, matchTime, period, periodLabel, isRunning, isCountdown }` | 计时器滴答（每秒广播） |
| `match:clock_end` | `{ matchId, period, periodLabel, message }` | 本节结束（倒计时归零时触发） |
| `score:update` | `{ matchId, homeScore, awayScore, period, matchTime }` | 比分更新 |
| `match:state` | `{ match: { id, homeScore, awayScore, currentPeriod, ... } }` | 加入房间后推送的完整状态 |
| `sync:ack` | `{ success, action?, error? }` | 操作确认（timer:start/pause/reset 的 ACK） |
| `error` | `{ message: string }` | 服务器错误通知 |

> **注意**: 不存在 `match:update`、`match:event`、`broadcast:scene_change`、`timer:tick` 这些事件。实际使用的是 `score:update` 和 `match:clock`。

---

## 数据模型关系

```
Events (赛事)
  └── Matches (比赛) ← 1:N
        ├── Teams_Matches (队伍关联) ← N:2
        │     └── Players (球员)
        ├── MatchEvents (比赛事件) ← 1:N
        ├── BroadcastScenes (导播场景) ← 1:1
        └── MatchParticipants (选手) ← race 类专用
```
