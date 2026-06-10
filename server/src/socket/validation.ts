import { z } from 'zod';

// ─── Event Data Schemas ───────────────────────────────────────

/** 加入比赛房间 — 支持直接传 matchId 字符串或对象 */
export const MatchJoinSchema = z.union([
  z.string().min(1, 'matchId is required'),
  z.object({ matchId: z.string().min(1, 'matchId is required') }),
]);

/** 离开比赛房间 */
export const MatchLeaveSchema = z.union([
  z.string().min(1, 'matchId is required'),
  z.object({ matchId: z.string().min(1, 'matchId is required') }),
]);

/** 启动/恢复计时 */
export const TimerStartSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
});

/** 暂停计时 */
export const TimerPauseSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
});

/** 重置计时 */
export const TimerResetSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
  period: z.number().int().positive().optional(),
});

/** 客户端事件上报 */
export const ClientReportSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
  type: z.string().min(1, 'event type is required'),
  period: z.number().int().positive(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
  detail: z.record(z.unknown()).optional(),
  reportedBy: z.string().optional(),
});

// ─── Type Exports ─────────────────────────────────────────────

export type MatchJoinData = z.infer<typeof MatchJoinSchema>;
export type MatchLeaveData = z.infer<typeof MatchLeaveSchema>;
export type TimerStartData = z.infer<typeof TimerStartSchema>;
export type TimerPauseData = z.infer<typeof TimerPauseSchema>;
export type TimerResetData = z.infer<typeof TimerResetSchema>;
export type ClientReportData = z.infer<typeof ClientReportSchema>;
