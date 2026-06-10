/**
 * validation.test.ts
 * 测试 Socket.IO 数据校验 schemas（Zod）。
 */
import {
  MatchJoinSchema,
  MatchLeaveSchema,
  TimerStartSchema,
  TimerPauseSchema,
  TimerResetSchema,
  ClientReportSchema,
} from './validation';

describe('Socket.IO 数据校验', () => {
  // ========== MatchJoinSchema ==========
  describe('MatchJoinSchema', () => {
    it('应接受字符串 matchId', () => {
      const result = MatchJoinSchema.safeParse('match-123');
      expect(result.success).toBe(true);
      if (result.success) {
        // 可能是 string 或 object
        expect(typeof result.data === 'string' || typeof result.data === 'object').toBe(true);
      }
    });

    it('应接受对象 { matchId: string }', () => {
      const result = MatchJoinSchema.safeParse({ matchId: 'match-123' });
      expect(result.success).toBe(true);
    });

    it('应拒绝空字符串', () => {
      const result = MatchJoinSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('应拒绝缺少 matchId 的对象', () => {
      const result = MatchJoinSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ========== MatchLeaveSchema ==========
  describe('MatchLeaveSchema', () => {
    it('应接受字符串 matchId', () => {
      const result = MatchLeaveSchema.safeParse('match-123');
      expect(result.success).toBe(true);
    });

    it('应接受对象 { matchId: string }', () => {
      const result = MatchLeaveSchema.safeParse({ matchId: 'match-123' });
      expect(result.success).toBe(true);
    });

    it('应拒绝空字符串', () => {
      const result = MatchLeaveSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ========== TimerStartSchema ==========
  describe('TimerStartSchema', () => {
    it('应接受 { matchId: string }', () => {
      const result = TimerStartSchema.safeParse({ matchId: 'm1' });
      expect(result.success).toBe(true);
    });

    it('应拒绝缺少 matchId', () => {
      const result = TimerStartSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ========== TimerPauseSchema ==========
  describe('TimerPauseSchema', () => {
    it('应接受 { matchId: string }', () => {
      const result = TimerPauseSchema.safeParse({ matchId: 'm1' });
      expect(result.success).toBe(true);
    });
  });

  // ========== TimerResetSchema ==========
  describe('TimerResetSchema', () => {
    it('应接受 { matchId: string }', () => {
      const result = TimerResetSchema.safeParse({ matchId: 'm1' });
      expect(result.success).toBe(true);
    });

    it('应接受可选 period (正整数)', () => {
      const result = TimerResetSchema.safeParse({ matchId: 'm1', period: 2 });
      expect(result.success).toBe(true);
    });

    it('应拒绝非正整数 period', () => {
      const result = TimerResetSchema.safeParse({ matchId: 'm1', period: 0 });
      expect(result.success).toBe(false);
    });

    it('应拒绝负数 period', () => {
      const result = TimerResetSchema.safeParse({ matchId: 'm1', period: -1 });
      expect(result.success).toBe(false);
    });
  });

  // ========== ClientReportSchema ==========
  describe('ClientReportSchema', () => {
    it('应接受有效上报', () => {
      const data = {
        matchId: 'm1',
        type: 'score',
        period: 1,
      };
      const result = ClientReportSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('应拒绝缺少 type', () => {
      const data = {
        matchId: 'm1',
        period: 1,
      };
      const result = ClientReportSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('应接受可选字段', () => {
      const data = {
        matchId: 'm1',
        type: 'substitution',
        period: 2,
        teamId: 'team-1',
        playerId: 'player-1',
        detail: { jerseyNumber: 10 },
        reportedBy: 'referee-1',
      };
      const result = ClientReportSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
