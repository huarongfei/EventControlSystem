import { Server as SocketIOServer } from 'socket.io';
import { matchRepository } from '../repositories/match.repository';
import { getSportRule, SportRule } from '../config/sport-rules';
import logger from '../utils/logger';

interface TimerState {
  intervalId: NodeJS.Timeout;
  matchId: string;
  // 倒计时（A类运动）
  remainingSeconds: number;
  // 正计时（B类运动）
  elapsedSeconds: number;
  period: number;
  isCountdown: boolean;
  periodNames: string[];
  saveIntervalId: NodeJS.Timeout;
}

/**
 * 服务端比赛计时器服务
 *
 * 支持两种计时模式：
 * - 倒计时（A类运动）：从 periodDuration 往 00:00 走
 * - 正计时（B类运动）：从 00:00 往上加
 */
export class MatchTimerService {
  private timers: Map<string, TimerState> = new Map();
  private io!: SocketIOServer;

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  /** 服务器重启后恢复所有 running 状态比赛的计时器 */
  async recoverTimers(io: SocketIOServer) {
    this.io = io;
    const runningMatches = await matchRepository.findByStatus('running');
    for (const match of runningMatches) {
      const m = match as any;
      const rule = getSportRule(m.sportType || 'basketball');
      const periodNames = rule.periodNames;
      const isCountdown = rule.isCountdown;
      const periodDuration = m.periodDuration ?? rule.periodDuration ?? 10;
      const period = m.currentPeriod ?? 1;

      if (isCountdown) {
        const remaining = this.parseTime(m.matchTime);
        this.startCountdown(match.id, remaining, period, periodDuration, periodNames);
      } else {
        // B类运动：从 matchTime（已走过的秒数）继续
        const elapsed = this.parseTime(m.matchTime);
        this.startCountUp(match.id, elapsed, period, periodNames);
      }
      logger.info(`[Timer] Recovered timer for match ${match.id} (${m.category}/${m.sportType})`);
    }
    if (runningMatches.length > 0) {
      logger.info(`[Timer] Recovered ${runningMatches.length} running timer(s)`);
    }
  }

  /** 状态变更时由 MatchService 调用 */
  onStatusChange(matchId: string, newStatus: string, match: any) {
    if (!this.io) return;
    const m = match as any;
    const rule = getSportRule(m.sportType || 'basketball');
    const periodNames = rule.periodNames;
    const isCountdown = rule.isCountdown;
    const periodDuration = m.periodDuration ?? rule.periodDuration ?? 10;
    const period = m.currentPeriod ?? 1;

    switch (newStatus) {
      case 'running':
        if (isCountdown) {
          const remaining = this.parseTime(m.matchTime);
          this.startCountdown(matchId, remaining, period, periodDuration, periodNames);
        } else {
          const elapsed = this.parseTime(m.matchTime);
          this.startCountUp(matchId, elapsed, period, periodNames);
        }
        logger.info(`[Timer] Started (${isCountdown ? 'countdown' : 'countup'}) for match ${matchId}`);
        break;
      case 'paused':
        this.pauseTimer(matchId);
        logger.info(`[Timer] Paused timer for match ${matchId}`);
        break;
      case 'finished':
        this.stopTimer(matchId);
        logger.info(`[Timer] Stopped timer for match ${matchId} (finished)`);
        break;
      case 'not_started':
        this.stopTimer(matchId);
        if (isCountdown) {
          this.resetMatchTime(matchId, periodDuration);
        } else {
          this.resetMatchTime(matchId, 0); // 竞速赛重置为 00:00
        }
        logger.info(`[Timer] Reset timer for match ${matchId} (not_started)`);
        break;
    }
  }

  resetToPeriod(matchId: string, period: number, periodDurationMinutes: number, sportType: string) {
    this.stopTimer(matchId);
    const rule = getSportRule(sportType);
    const isCountdown = rule.isCountdown;
    const seconds = isCountdown ? periodDurationMinutes * 60 : 0;
    const matchTime = isCountdown ? this.formatTime(seconds) : '00:00';
    this.saveMatchTime(matchId, matchTime);
    if (this.io) {
      this.io.to(`match:${matchId}`).emit('match:clock', {
        matchId,
        elapsedSeconds: isCountdown ? seconds : 0,
        remainingSeconds: isCountdown ? seconds : 0,
        matchTime,
        period,
        periodLabel: rule.periodNames[period - 1] ?? `第${period}节`,
        isRunning: false,
        category: rule.category,
        isCountdown,
      });
    }
  }

  destroyAll() {
    for (const [, state] of this.timers) {
      clearInterval(state.intervalId);
      clearInterval(state.saveIntervalId);
    }
    this.timers.clear();
    logger.info('[Timer] All timers destroyed');
  }

  // ─── 私有方法 ─────────────────────────────────────────────

  /** 启动倒计时（A类运动） */
  private startCountdown(
    matchId: string,
    remainingSeconds: number,
    period: number,
    periodDurationMinutes: number,
    periodNames: string[],
  ) {
    this.pauseTimer(matchId);
    let remaining = remainingSeconds;
    const periodDurationSeconds = periodDurationMinutes * 60;

    const intervalId = setInterval(() => {
      remaining--;
      if (remaining < 0) remaining = 0;

      this.broadcastClock(matchId, {
        remainingSeconds: remaining,
        elapsedSeconds: periodDurationSeconds - remaining,
        matchTime: this.formatTime(remaining),
        period,
        periodLabel: periodNames[period - 1] ?? `第${period}节`,
        isRunning: true,
        isCountdown: true,
      });

      if (remaining <= 0) {
        this.pauseTimer(matchId);
        this.broadcast(matchId, 'match:clock_end', {
          matchId,
          period,
          periodLabel: periodNames[period - 1] ?? `第${period}节`,
          message: `${periodNames[period - 1] ?? '本节'}结束`,
        });
        logger.info(`[Timer] Period ${period} ended for match ${matchId}`);
      }
    }, 1000);

    const saveIntervalId = setInterval(() => {
      this.saveMatchTime(matchId, this.formatTime(remaining));
    }, 10_000);

    this.timers.set(matchId, {
      intervalId, matchId,
      remainingSeconds: remaining,
      elapsedSeconds: periodDurationSeconds - remaining,
      period, isCountdown: true, periodNames,
      saveIntervalId,
    });

    // 立即广播一次
    this.broadcastClock(matchId, {
      remainingSeconds: remaining,
      elapsedSeconds: periodDurationSeconds - remaining,
      matchTime: this.formatTime(remaining),
      period,
      periodLabel: periodNames[period - 1] ?? `第${period}节`,
      isRunning: true,
      isCountdown: true,
    });
  }

  /** 启动正计时（B类运动：游泳/跑步） */
  private startCountUp(
    matchId: string,
    elapsedSeconds: number,
    period: number,
    periodNames: string[],
  ) {
    this.pauseTimer(matchId);
    let elapsed = elapsedSeconds;

    const intervalId = setInterval(() => {
      elapsed++;
      // 正计时没有上限（比赛时间可能很长），不自动停止

      this.broadcastClock(matchId, {
        remainingSeconds: 0,
        elapsedSeconds: elapsed,
        matchTime: this.formatTime(elapsed),
        period,
        periodLabel: periodNames[period - 1] ?? '比赛进行中',
        isRunning: true,
        isCountdown: false,
      });
    }, 1000);

    // 正计时每 10 秒写一次
    const saveIntervalId = setInterval(() => {
      this.saveMatchTime(matchId, this.formatTime(elapsed));
    }, 10_000);

    this.timers.set(matchId, {
      intervalId, matchId,
      remainingSeconds: 0,
      elapsedSeconds: elapsed,
      period, isCountdown: false, periodNames,
      saveIntervalId,
    });

    // 立即广播一次
    this.broadcastClock(matchId, {
      remainingSeconds: 0,
      elapsedSeconds: elapsed,
      matchTime: this.formatTime(elapsed),
      period,
      periodLabel: periodNames[period - 1] ?? '比赛进行中',
      isRunning: true,
      isCountdown: false,
    });
  }

  private pauseTimer(matchId: string) {
    const state = this.timers.get(matchId);
    if (!state) return;

    clearInterval(state.intervalId);
    clearInterval(state.saveIntervalId);

    // 保存当前时间到数据库
    const matchTime = state.isCountdown
      ? this.formatTime(state.remainingSeconds)
      : this.formatTime(state.elapsedSeconds);
    this.timers.delete(matchId);

    matchRepository.findById(matchId).then(match => {
      const m = match as any;
      const rule = getSportRule(m.sportType || 'basketball');
      this.broadcastClock(matchId, {
        remainingSeconds: state.remainingSeconds,
        elapsedSeconds: state.elapsedSeconds,
        matchTime,
        period: m.currentPeriod ?? 1,
        periodLabel: rule.periodNames[(m.currentPeriod ?? 1) - 1] ?? '暂停',
        isRunning: false,
        isCountdown: state.isCountdown,
      });
    }).catch(() => {});
  }

  private stopTimer(matchId: string) {
    const state = this.timers.get(matchId);
    if (state) {
      clearInterval(state.intervalId);
      clearInterval(state.saveIntervalId);
      this.timers.delete(matchId);
    }
  }

  private async saveMatchTime(matchId: string, matchTime: string) {
    try {
      await matchRepository.updateMatchTime(matchId, matchTime);
    } catch (err) {
      logger.error(`[Timer] Failed to save matchTime for ${matchId}: ${err}`);
    }
  }

  private async resetMatchTime(matchId: string, periodDurationMinutes: number) {
    const seconds = periodDurationMinutes * 60;
    const matchTime = this.formatTime(seconds);
    try {
      await matchRepository.updateMatchTime(matchId, matchTime);
    } catch (err) {
      logger.error(`[Timer] Failed to reset matchTime for ${matchId}: ${err}`);
    }
  }

  private broadcastClock(matchId: string, payload: Record<string, unknown>) {
    if (!this.io) return;
    this.io.to(`match:${matchId}`).emit('match:clock', { matchId, ...payload });
  }

  private broadcast(matchId: string, event: string, payload: Record<string, unknown>) {
    if (!this.io) return;
    this.io.to(`match:${matchId}`).emit(event, payload);
  }

  /** "MM:SS" → 总秒数 */
  private parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  /** 总秒数 → "MM:SS" */
  private formatTime(totalSeconds: number): string {
    if (totalSeconds < 0) totalSeconds = 0;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

export const matchTimerService = new MatchTimerService();
