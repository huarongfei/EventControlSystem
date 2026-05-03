# EventControlSystem API 文档

## 概述

EventControlSystem 后端提供 RESTful API 和 WebSocket 接口，用于管理体育比赛的各个方面。

**基础 URL**: `http://localhost:3001`
**WebSocket**: `ws://localhost:3001/socket.io`

---

## 认证

当前版本无需认证。生产环境部署时请添加适当的认证机制（如 JWT）。

---

## 常用状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 赛事管理 API

### 获取赛事列表

```
GET /api/events
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "43073d4e-4374-4d45-965c-3bb11d84651c",
      "name": "2026年上海市大学生篮球联赛",
      "sportType": "basketball",
      "description": "上海市高校篮球比赛",
      "status": "active",
      "createdAt": "2026-04-19T00:00:00.000Z",
      "updatedAt": "2026-04-19T00:00:00.000Z"
    }
  ]
}
```

### 创建赛事

```
POST /api/events
```

**请求体**:
```json
{
  "name": "2026年上海市大学生篮球联赛",
  "sportType": "basketball",
  "description": "上海市高校篮球比赛"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "43073d4e-4374-4d45-965c-3bb11d84651c",
    "name": "2026年上海市大学生篮球联赛",
    "sportType": "basketball",
    "description": "上海市高校篮球比赛",
    "status": "active",
    "createdAt": "2026-04-19T00:00:00.000Z",
    "updatedAt": "2026-04-19T00:00:00.000Z"
  }
}
```

### 获取赛事详情

```
GET /api/events/:id
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "43073d4e-4374-4d45-965c-3bb11d84651c",
    "name": "2026年上海市大学生篮球联赛",
    "sportType": "basketball",
    "description": "上海市高校篮球比赛",
    "status": "active",
    "matches": [...],
    "createdAt": "2026-04-19T00:00:00.000Z",
    "updatedAt": "2026-04-19T00:00:00.000Z"
  }
}
```

### 删除赛事

```
DELETE /api/events/:id
```

---

## 比赛管理 API

### 获取比赛列表

```
GET /api/matches
```

**查询参数**:
- `eventId` (可选): 筛选指定赛事下的比赛

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "46a9f476-b050-4e88-84cc-0a44c16b7c03",
      "eventId": "43073d4e-4374-4d45-965c-3bb11d84651c",
      "homeTeam": {
        "id": "team-001",
        "name": "华东理工大学"
      },
      "awayTeam": {
        "id": "team-002",
        "name": "交通大学"
      },
      "homeScore": 45,
      "awayScore": 38,
      "period": 2,
      "periodTime": "15:32",
      "status": "running"
    }
  ]
}
```

### 创建比赛

```
POST /api/matches
```

**请求体**:
```json
{
  "eventId": "43073d4e-4374-4d45-965c-3bb11d84651c",
  "homeTeamId": "team-001",
  "awayTeamId": "team-002",
  "scheduledAt": "2026-04-19T14:00:00.000Z"
}
```

### 获取比赛详情

```
GET /api/matches/:id/detail
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "46a9f476-b050-4e88-84cc-0a44c16b7c03",
    "eventId": "43073d4e-4374-4d45-965c-3bb11d84651c",
    "homeTeam": {...},
    "awayTeam": {...},
    "homeScore": 45,
    "awayScore": 38,
    "period": 2,
    "periodTime": "15:32",
    "status": "running",
    "events": [
      {
        "id": "event-001",
        "type": "score",
        "team": "home",
        "playerId": "player-001",
        "points": 2,
        "timestamp": "2026-04-19T14:32:00.000Z"
      }
    ],
    "statistics": {
      "homeTeam": {...},
      "awayTeam": {...}
    }
  }
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
  "periodTime": "14:58"
}
```

### 更新比赛状态

```
PUT /api/matches/:id/status
```

**请求体**:
```json
{
  "status": "paused"
}
```

**状态值**: `pending`, `running`, `paused`, `finished`, `cancelled`

### 上报比赛事件

```
POST /api/matches/:id/events
```

**请求体**:
```json
{
  "type": "score",
  "team": "home",
  "playerId": "player-001",
  "points": 2,
  "metadata": {
    "description": "两分球"
  }
}
```

**事件类型**:
- `score`: 得分
- `foul`: 犯规
- `substitution`: 换人
- `timeout`: 暂停
- `injury`: 伤病

### 导出比赛数据

```
GET /api/matches/:id/export?format=json
GET /api/matches/:id/export?format=csv
```

---

## 队伍管理 API

### 获取队伍列表

```
GET /api/teams
```

### 创建队伍

```
POST /api/teams
```

**请求体**:
```json
{
  "name": "华东理工大学",
  "sportType": "basketball",
  "players": [
    {
      "name": "张三",
      "number": 10,
      "position": "PG"
    }
  ]
}
```

### 获取队伍详情

```
GET /api/teams/:id
```

### 获取队伍球员

```
GET /api/teams/:id/players
```

### 添加球员

```
POST /api/teams/:id/players
```

**请求体**:
```json
{
  "name": "李四",
  "number": 11,
  "position": "SG"
}
```

---

## 导播场景 API

### 获取当前导播场景

```
GET /api/matches/:id/broadcast
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "matchId": "46a9f476-b050-4e88-84cc-0a44c16b7c03",
    "currentScene": "camera_2",
    "transitionMode": "cut",
    "slowMotion": {
      "enabled": false,
      "inPoint": null,
      "outPoint": null
    },
    "overlays": {
      "score": true,
      "timer": true,
      "teamLogos": false
    }
  }
}
```

### 更新导播场景

```
PUT /api/matches/:id/broadcast
```

**请求体**:
```json
{
  "currentScene": "camera_3",
  "transitionMode": "auto",
  "slowMotion": {
    "enabled": true,
    "inPoint": "00:45:23",
    "outPoint": "00:45:28"
  }
}
```

---

## 犯规类型 API

### 获取犯规类型列表

```
GET /api/foul-types
GET /api/foul-types?sportType=basketball
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "bb_personal",
      "sportType": "basketball",
      "code": "personal_foul",
      "name": "个人犯规",
      "nameEn": "Personal Foul",
      "severity": "common",
      "penalty": {
        "type": "possession",
        "description": "对方获得球权"
      },
      "description": "球员与对方球员发生非法身体接触"
    }
  ],
  "total": 16,
  "sportTypes": ["basketball", "football", "volleyball", ...]
}
```

### 获取支持的运动类型

```
GET /api/foul-types/sports
```

---

## 同步 API（离线模式）

### 批量同步离线事件

```
POST /api/sync
```

**请求体**:
```json
{
  "matchId": "46a9f476-b050-4e88-84cc-0a44c16b7c03",
  "events": [
    {
      "localId": "local-001",
      "type": "score",
      "timestamp": "2026-04-19T14:32:00.000Z",
      "data": {...}
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "synced": 5,
    "failed": 0,
    "mappings": [
      {"localId": "local-001", "serverId": "event-001"}
    ]
  }
}
```

---

## WebSocket 事件

### 连接

```
ws://localhost:3001/socket.io/
```

### 加入比赛房间

```javascript
socket.emit('match:join', { matchId: '46a9f476-b050-4e88-84cc-0a44c16b7c03' });
```

### 离开比赛房间

```javascript
socket.emit('match:leave', { matchId: '46a9f476-b050-4e88-84cc-0a44c16b7c03' });
```

### 计时控制

```javascript
// 启动计时
socket.emit('timer:start', { matchId: '...' });

// 暂停计时
socket.emit('timer:pause', { matchId: '...' });

// 重置计时
socket.emit('timer:reset', { matchId: '...' });
```

### 上报事件

```javascript
socket.emit('client:report', {
  matchId: '...',
  type: 'score',
  team: 'home',
  playerId: 'player-001',
  points: 2
});
```

### 接收事件

```javascript
// 接收当前比赛状态（加入房间后）
socket.on('match:state', (data) => {...});

// 接收新事件
socket.on('match:event', (data) => {...});

// 接收比赛更新
socket.on('match:update', (data) => {...});

// 接收计时更新
socket.on('timer:tick', (data) => {...});

// 接收导播场景切换
socket.on('broadcast:scene_change', (data) => {...});
```

---

## 错误处理

所有 API 错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "MATCH_NOT_FOUND",
    "message": "比赛不存在"
  }
}
```

**错误代码**:
- `VALIDATION_ERROR`: 请求参数验证失败
- `EVENT_NOT_FOUND`: 赛事不存在
- `MATCH_NOT_FOUND`: 比赛不存在
- `TEAM_NOT_FOUND`: 队伍不存在
- `UNAUTHORIZED`: 未授权（预留）
- `INTERNAL_ERROR`: 服务器内部错误
