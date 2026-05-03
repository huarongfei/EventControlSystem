// MatchModels.ets - 裁判端数据模型

/** 比赛状态 */
export enum MatchStatus {
  PENDING = 'pending',     // 未开始
  ONGOING = 'ongoing',     // 进行中
  PAUSED = 'paused',       // 暂停
  FINISHED = 'finished',   // 已结束
  CANCELLED = 'cancelled'  // 已取消
}

/** 事件类型 */
export enum EventType {
  SCORE = 'score',           // 得分
  FOUL = 'foul',             // 犯规
  SUBSTITUTION = 'sub',      // 换人
  TIMEOUT = 'timeout',       // 暂停请求
  INJURY = 'injury',         // 伤病
  QUARTER_CHANGE = 'quarter' // 节次变更
}

/** 队伍信息 */
export interface TeamInfo {
  id: string;
  name: string;
  score: number;
  timeouts: number;        // 剩余暂停次数
  fouls: number;          // 当前节犯规数
  players: PlayerInfo[];
}

/** 球员信息 */
export interface PlayerInfo {
  id: string;
  number: number;
  name: string;
  isOnCourt: boolean;     // 是否在场
  points: number;         // 个人得分
  fouls: number;          // 个人犯规
}

/** 比赛信息 */
export interface MatchInfo {
  id: string;
  eventId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: MatchStatus;
  currentQuarter: number;
  quarterTime: number;     // 当前节剩余时间（秒）
  maxQuarters: number;
}

/** 比赛事件 */
export interface MatchEvent {
  id?: string;
  type: EventType;
  teamId?: string;
  playerId?: string;
  quarter: number;
  time: number;            // 发生时间（节内时间）
  data?: Record<string, Object>;  // 附加数据
  timestamp: number;
  synced: boolean;        // 是否已同步到服务器
}

/** 连接状态 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SYNCING = 'syncing',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

/** API 响应 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/** 更新比分请求 */
export interface UpdateScoreRequest {
  homeScore: number;
  awayScore: number;
}

/** 上报事件请求 */
export interface ReportEventRequest {
  type: EventType;
  teamId?: string;
  playerId?: string;
  quarter: number;
  time: number;
  data?: Record<string, Object>;
}

/** 犯规处罚方式 */
export interface FoulPenalty {
  type: string;           // possession, free_throw, penalty_kick, etc.
  duration?: number;       // 处罚时长（秒）
  points?: number;         // 罚分
  description: string;      // 处罚描述
}

/** 犯规类型 - 从后端 /api/foul-types 获取 */
export interface FoulType {
  id: string;             // 唯一标识
  sportType: string;       // 运动类型: basketball, football, etc.
  code: string;           // 犯规代码
  name: string;           // 中文名称
  nameEn?: string;        // 英文名称
  severity: string;       // minor, common, severe, dangerous
  penalty: FoulPenalty;    // 处罚方式
  description: string;     // 犯规说明
}

/** 将 MatchEvent 转换为 ReportEventRequest */
export function matchEventToReportRequest(event: MatchEvent): ReportEventRequest {
  return {
    type: event.type,
    teamId: event.teamId,
    playerId: event.playerId,
    quarter: event.quarter,
    time: event.time,
    data: event.data
  };
}
