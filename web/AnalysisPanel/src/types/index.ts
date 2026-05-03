// ============================================================
// ECS 赛况分析面板 - 类型定义
// ============================================================

/** 运动类别 */
export type SportCategory = 'team' | 'race';

/** 运动类型 */
export type SportType =
  | 'basketball'   // 篮球
  | 'football'     // 足球
  | 'volleyball'   // 排球
  | 'badminton'    // 羽毛球
  | 'tennis'       // 网球
  | 'table_tennis' // 乒乓球
  | 'swimming'     // 游泳
  | 'running';     // 跑步

/** 比赛状态 */
export type MatchStatus = 'upcoming' | 'live' | 'paused' | 'finished';

/** 比赛小节（A类用数字/'OT'，B类用字符串如"决赛"） */
export type Quarter = number | 'OT' | string;

/** 竞速赛配置 */
export interface RaceConfig {
  lanes: number;
  recordSplits: boolean;
  splitDistances: number[];
}

/** 运动规则 */
export interface SportRule {
  sportType: SportType;
  displayName: string;
  emoji: string;
  category: SportCategory;
  periodCount: number;
  periodDuration: number;
  periodGoal: number;
  periodNames: string[];
  periodNamesShort: string[];
  isCountdown: boolean;
  scoreButtons: number[];
  eventTypes: string[];
  teamStats: string[];
  playerStats: string[];
  raceConfig?: RaceConfig;
}

/** 分段成绩 */
export interface SplitTime {
  lap: number;
  distance?: number;
  time: string;   // "00:28.35"
}

/** 竞速赛参赛选手 */
export interface MatchParticipant {
  id: string;
  matchId: string;
  laneNumber: number;    // 泳道号/跑道号
  athleteName: string;
  teamName?: string;
  splitTimes: SplitTime[];
  finalTime?: string;     // "01:45.23"
  rank?: number;
  status: 'pending' | 'running' | 'finished' | 'dq';
}

/** 事件类型（保留向后兼容，实际从 SportRule.eventTypes 动态读取） */
export type EventType =
  | 'two_point_made'
  | 'three_point_made'
  | 'free_throw_made'
  | 'score'
  | 'foul'
  | 'timeout';

/** 球队信息 */
export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/** 球员信息（A类运动） */
export interface Player {
  id: string;
  teamId: string;
  number: number;
  name: string;
  position?: string;
  isOnCourt?: boolean;
}

/** 球员统计数据（A类运动） */
export interface PlayerStats {
  playerId: string;
  player: Player;
  points: number;
  twoPointMade: number;
  twoPointAttempted: number;
  threePointMade: number;
  threePointAttempted: number;
  freeThrowMade: number;
  freeThrowAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  totalRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus?: number;
  efficiency: number;
}

/** 球队统计数据（A类运动） */
export interface TeamStats {
  teamId: string;
  team: Team;
  score: number;
  twoPointMade: number;
  twoPointAttempted: number;
  threePointMade: number;
  threePointAttempted: number;
  freeThrowMade: number;
  freeThrowAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  totalRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

/** 比赛事件 */
export interface MatchEvent {
  id: string;
  matchId: string;
  teamId?: string;
  playerId?: string;
  playerNumber?: number;
  playerName?: string;
  eventType: string;
  quarter: Quarter;
  timestamp: string;
  gameClock: string;
  description: string;
  points?: number;
}

/** 比赛得分走势数据点（A类运动） */
export interface ScoreTrendPoint {
  gameClock: string;
  homeScore: number;
  awayScore: number;
  quarter: Quarter;
}

/** 比赛信息 */
export interface Match {
  id: string;
  name?: string;
  category: SportCategory;
  sportType: SportType;
  homeTeam: Team;
  awayTeam: Team;
  homeStats: TeamStats;
  awayStats: TeamStats;
  homePlayers: PlayerStats[];
  awayPlayers: PlayerStats[];
  participants?: MatchParticipant[];  // B类运动选手列表
  events: MatchEvent[];
  scoreTrend: ScoreTrendPoint[];
  status: MatchStatus;
  currentQuarter: Quarter;
  gameClock: string;
  startTime: string;
  venue?: string;
}

/** 比赛列表项（精简版） */
export interface MatchListItem {
  id: string;
  name?: string;
  category: SportCategory;
  sportType: SportType;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  currentQuarter: Quarter;
  gameClock: string;
  startTime: string;
}

/** WebSocket 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/** 比分更新事件 payload */
export interface ScoreUpdatePayload {
  matchId: string;
  homeScore: number;
  awayScore: number;
  quarter: Quarter;
  gameClock: string;
  teamId: string;
  playerId?: string;
  playerNumber?: number;
  points: number;
}

/** 比赛事件 payload */
export interface MatchEventPayload {
  matchId: string;
  event: MatchEvent;
}

/** 比赛状态变更 payload */
export interface MatchStatusPayload {
  matchId: string;
  status: MatchStatus;
  previousStatus: MatchStatus;
}
