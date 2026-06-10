import { MatchTimerService } from '../src/services/match-timer.service';
import { Server } from 'socket.io';

// ─── Mocks ──────────────────────────────────────────────────
jest.mock('../src/repositories/match.repository', () => ({
  matchRepository: {
    findByStatus: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue({
      id: 'match-1',
      sportType: 'basketball',
      currentPeriod: 1,
      category: 'team',
      matchTime: '10:00',
    }),
    updateMatchTime: jest.fn().mockResolvedValue({}),
    updateCurrentPeriod: jest.fn().mockResolvedValue({}),
  },
}));

jest.useFakeTimers();

describe('MatchTimerService', () => {
  let service: MatchTimerService;
  let mockIo: Server;

  beforeEach(() => {
    service = new MatchTimerService();
    mockIo = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as unknown as Server;
    service.setIO(mockIo);
  });

  afterEach(() => {
    service.destroyAll();
    jest.clearAllMocks();
  });

  // ════════════════════════════════════════
  //  parseTime — 时间字符串解析
  // ════════════════════════════════════════

  describe('parseTime (via onStatusChange)', () => {
    it('should start countdown with valid "MM:SS" time for basketball', () => {
      service.onStatusChange('m1', 'running', {
        id: 'm1',
        sportType: 'basketball',
        currentPeriod: 2,
        periodDuration: 10,
        category: 'team',
        matchTime: '08:30',
      });

      // Should have created a timer entry
      expect((service as any).timers.has('m1')).toBe(true);

      const state = (service as any).timers.get('m1');
      expect(state.remainingSeconds).toBe(8 * 60 + 30); // 510s
      expect(state.isCountdown).toBe(true);
      expect(state.period).toBe(2);
    });

    it('should fallback to 0 for invalid time string', () => {
      expect(() => {
        service.onStatusChange('m2', 'running', {
          id: 'm2',
          sportType: 'basketball',
          currentPeriod: 1,
          periodDuration: 10,
          category: 'team',
          matchTime: 'invalid',
        });
      }).not.toThrow();

      const state = (service as any).timers.get('m2');
      expect(state.remainingSeconds).toBe(0); // fallback value
    });

    it('should handle empty time string gracefully', () => {
      service.onStatusChange('m3', 'running', {
        id: 'm3',
        sportType: 'football',
        currentPeriod: 1,
        periodDuration: 45,
        category: 'team',
        matchTime: '',
      });

      const state = (service as any).timers.get('m3');
      // Football is count-up mode (isCountdown=false)
      expect(state.elapsedSeconds).toBe(0);
      expect(state.isCountdown).toBe(false);
    });
  });

  // ════════════════════════════════════════
  //  formatTime — 秒数格式化
  // ════════════════════════════════════════

  describe('formatTime (indirect via broadcast)', () => {
    it('should format countdown time correctly in broadcasts', () => {
      service.onStatusChange('m4', 'running', {
        id: 'm4',
        sportType: 'basketball',
        currentPeriod: 1,
        periodDuration: 10,
        category: 'team',
        matchTime: '05:25',
      });

      const toMock = (mockIo.to as jest.Mock).mock.results[0]?.value;
      const emitMock = toMock?.emit as jest.Mock;
      expect(emitMock).toHaveBeenCalled();

      const callArgs = emitMock.mock.calls[0];
      const payload = callArgs[1]; // second arg is the data object
      expect(payload.matchTime).toBe('05:25');
    });
  });

  // ════════════════════════════════════════
  //  状态变更：running → paused → finished
  // ════════════════════════════════════════

  describe('onStatusChange — lifecycle', () => {
    it('should create timer on "running" status', () => {
      service.onStatusChange('m5', 'running', {
        id: 'm5',
        sportType: 'basketball',
        currentPeriod: 1,
        periodDuration: 10,
        category: 'team',
        matchTime: '10:00',
      });

      expect((service as any).timers.has('m5')).toBe(true);
    });

    it('should pause timer on "paused" status', () => {
      // Start first
      service.onStatusChange('m5', 'running', {
        id: 'm5',
        sportType: 'basketball',
        currentPeriod: 1,
        periodDuration: 10,
        category: 'team',
        matchTime: '10:00',
      });
      expect((service as any).timers.has('m5')).toBe(true);

      // Then pause
      service.onStatusChange('m5', 'paused', {
        id: 'm5',
        sportType: 'basketball',
        currentPeriod: 1,
        periodDuration: 10,
        category: 'team',
        matchTime: '09:45',
      });

      // Timer should be removed from map after pause
      expect((service as any).timers.has('m5')).toBe(false);
    });

    it('should stop timer on "finished" status', () => {
      service.onStatusChange('m6', 'running', {
        id: 'm6',
        sportType: 'basketball',
        currentPeriod: 3,
        periodDuration: 10,
        category: 'team',
        matchTime: '05:00',
      });
      expect((service as any).timers.has('m6')).toBe(true);

      service.onStatusChange('m6', 'finished', {
        id: 'm6',
        sportType: 'basketball',
        currentPeriod: 3,
        periodDuration: 10,
        category: 'team',
        matchTime: '00:00',
      });

      expect((service as any).timers.has('m6')).toBe(false);
    });

    it('should reset timer on "not_started" status', () => {
      service.onStatusChange('m7', 'not_started', {
        id: 'm7',
        sportType: 'basketball',
        currentPeriod: 1,
        periodDuration: 12,
        category: 'team',
        matchTime: '12:00',
      });

      // not_started should clear the timer and reset
      expect((service as any).timers.has('m7')).toBe(false);
    });

    it('should not crash when IO is not set', () => {
      const noIoService = new MatchTimerService();

      expect(() => {
        noIoService.onStatusChange('mx', 'running', {
          id: 'mx',
          sportType: 'basketball',
          currentPeriod: 1,
          periodDuration: 10,
          category: 'team',
          matchTime: '10:00',
        });
      }).not.toThrow();

      noIoService.destroyAll();
    });
  });

  // ════════════════════════════════════════
  //  B类运动（竞速/正计时模式）
  // ════════════════════════════════════════

  describe('count-up mode (B-type sports)', () => {
    it('should start count-up timer for swimming/running', () => {
      service.onStatusChange('m8', 'running', {
        id: 'm8',
        sportType: 'swimming',
        currentPeriod: 1,
        periodDuration: 0,
        category: 'race',
        matchTime: '01:30',
      });

      const state = (service as any).timers.get('m8');
      expect(state.isCountdown).toBe(false);
      expect(state.elapsedSeconds).toBe(90); // 1min30sec = 90s
    });

    it('should use 0 elapsed for empty matchTime in count-up mode', () => {
      service.onStatusChange('m9', 'running', {
        id: 'm9',
        sportType: 'running',
        currentPeriod: 1,
        periodDuration: 0,
        category: 'race',
        matchTime: '',
      });

      const state = (service as any).timers.get('m9');
      expect(state.elapsedSeconds).toBe(0);
      expect(state.isCountdown).toBe(false);
    });
  });

  // ════════════════════════════════════════
  //  resetToPeriod
  // ════════════════════════════════════════

  describe('resetToPeriod', () => {
    it('should stop existing timer and set new period', () => {
      // Start a timer first
      service.onStatusChange('m10', 'running', {
        id: 'm10',
        sportType: 'basketball',
        currentPeriod: 1,
        periodDuration: 10,
        category: 'team',
        matchTime: '08:00',
      });
      expect((service as any).timers.has('m10')).toBe(true);

      // Reset to period 2
      service.resetToPeriod('m10', 2, 10, 'basketball');

      expect((service as any).timers.has('m10')).toBe(false);
    });

    it('should broadcast clock change on period reset', () => {
      service.resetToPeriod('m11', 3, 8, 'volleyball');

      expect(mockIo.to).toHaveBeenCalledWith('match:m11');
      const toMock = (mockIo.to as jest.Mock).mock.results[0]?.value;
      expect(toMock.emit).toHaveBeenCalledWith(
        'match:clock',
        expect.objectContaining({
          matchId: 'm11',
          period: 3,
          isRunning: false,
        })
      );
    });
  });

  // ════════════════════════════════════════
  //  destroyAll
  // ════════════════════════════════════════

  describe('destroyAll', () => {
    it('should clear all timers', () => {
      service.onStatusChange('a', 'running', {
        id: 'a', sportType: 'basketball', currentPeriod: 1,
        periodDuration: 10, category: 'team', matchTime: '10:00',
      });
      service.onStatusChange('b', 'running', {
        id: 'b', sportType: 'basketball', currentPeriod: 1,
        periodDuration: 10, category: 'team', matchTime: '10:00',
      });
      service.onStatusChange('c', 'running', {
        id: 'c', sportType: 'swimming', currentPeriod: 1,
        periodDuration: 0, category: 'race', matchTime: '01:00',
      });

      expect((service as any).timers.size).toBe(3);

      service.destroyAll();

      expect((service as any).timers.size).toBe(0);
    });

    it('should not throw when no timers exist', () => {
      expect(() => service.destroyAll()).not.toThrow();
    });
  });

  // ════════════════════════════════════════
  //  recoverTimers
  // ════════════════════════════════════════

  describe('recoverTimers', () => {
    it('should recover running matches after restart', async () => {
      const { matchRepository: mockedRepo } = require('../src/repositories/match.repository');
      (mockedRepo.findByStatus as jest.Mock).mockResolvedValueOnce([
        {
          id: 'recovered-1',
          sportType: 'basketball',
          category: 'team',
          currentPeriod: 2,
          periodDuration: 10,
          matchTime: '07:15',
        },
      ]);

      await service.recoverTimers(mockIo);

      expect((service as any).timers.has('recovered-1')).toBe(true);
      const state = (service as any).timers.get('recovered-1');
      expect(state.period).toBe(2);
      expect(state.remainingSeconds).toBe(7 * 60 + 15);
    });

    it('should handle empty recovery list gracefully', async () => {
      const { matchRepository: mockedRepo } = require('../src/repositories/match.repository');
      (mockedRepo.findByStatus as jest.Mock).mockResolvedValueOnce([]);

      await expect(service.recoverTimers(mockIo)).resolves.not.toThrow();
      expect((service as any).timers.size).toBe(0);
    });
  });
});
