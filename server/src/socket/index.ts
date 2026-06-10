import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { matchService } from '../services/match.service';
import { matchTimerService } from '../services/match-timer.service';
import logger from '../utils/logger';
import {
  MatchJoinSchema,
  MatchLeaveSchema,
  TimerStartSchema,
  TimerPauseSchema,
  TimerResetSchema,
  ClientReportSchema,
} from './validation';
import { config } from '../config';

let io: SocketIOServer;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // 把 Socket.IO 实例注入计时器服务
  matchTimerService.setIO(io);

  // 恢复所有运行中的计时器（服务器刚启动时）
  matchTimerService.recoverTimers(io).catch(err => {
    logger.error(`[Timer] Failed to recover timers: ${err}`);
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a match room
    socket.on('match:join', async (data: unknown) => {
      const parsed = MatchJoinSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid match:join payload', details: parsed.error.issues });
        return;
      }
      try {
        const matchId = typeof parsed.data === 'string' ? parsed.data : parsed.data.matchId;
        await matchService.getById(matchId);
        socket.join(`match:${matchId}`);
        logger.info(`Socket ${socket.id} joined match room: ${matchId}`);

        // Send current match state to the joining client
        const match = await matchService.getById(matchId);
        const broadcast = await matchService.getBroadcast(matchId);
        socket.emit('match:state', {
          match,
          broadcastScene: broadcast,
        });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to join match room' });
      }
    });

    // Leave a match room
    socket.on('match:leave', (data: unknown) => {
      const parsed = MatchLeaveSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid match:leave payload', details: parsed.error.issues });
        return;
      }
      const matchId = typeof parsed.data === 'string' ? parsed.data : parsed.data.matchId;
      socket.leave(`match:${matchId}`);
      logger.info(`Socket ${socket.id} left match room: ${matchId}`);
    });

    // ─── 计时器控制 ───────────────────────────────────────
    // 客户端请求启动/恢复计时
    socket.on('timer:start', async (data: unknown) => {
      const parsed = TimerStartSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('timer:ack', { success: false, action: 'start', error: 'Invalid payload', details: parsed.error.issues });
        return;
      }
      try {
        const match = await matchService.getById(parsed.data.matchId);
        if ((match as any).status !== 'running') {
          await matchService.updateStatus(parsed.data.matchId, { status: 'running' });
        }
        socket.emit('timer:ack', { success: true, action: 'start' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'start', error: err.message });
      }
    });

    // 客户端请求暂停计时
    socket.on('timer:pause', async (data: unknown) => {
      const parsed = TimerPauseSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('timer:ack', { success: false, action: 'pause', error: 'Invalid payload', details: parsed.error.issues });
        return;
      }
      try {
        const match = await matchService.getById(parsed.data.matchId);
        if ((match as any).status !== 'paused') {
          await matchService.updateStatus(parsed.data.matchId, { status: 'paused' });
        }
        socket.emit('timer:ack', { success: true, action: 'pause' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'pause', error: err.message });
      }
    });

    // 客户端请求重置计时（到当前节的初始时间）
    socket.on('timer:reset', async (data: unknown) => {
      const parsed = TimerResetSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('timer:ack', { success: false, action: 'reset', error: 'Invalid payload', details: parsed.error.issues });
        return;
      }
      try {
        const match = await matchService.getById(parsed.data.matchId);
        const m = match as any;
        const period = parsed.data.period ?? m.currentPeriod;
        const periodDuration = m.periodDuration ?? 10;
        matchTimerService.resetToPeriod(parsed.data.matchId, period, periodDuration, m.sportType ?? 'basketball');
        socket.emit('timer:ack', { success: true, action: 'reset' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'reset', error: err.message });
      }
    });

    // 客户端汇报事件（Android 裁判端）
    socket.on('client:report', async (data: unknown) => {
      const parsed = ClientReportSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('sync:ack', {
          success: false,
          error: 'Invalid client:report payload',
          details: parsed.error.issues,
        });
        return;
      }
      try {
        const matchEvent = await matchService.addEvent(parsed.data.matchId, {
          type: parsed.data.type,
          period: parsed.data.period,
          teamId: parsed.data.teamId,
          playerId: parsed.data.playerId,
          detail: parsed.data.detail,
          reportedBy: parsed.data.reportedBy || socket.id,
        });

        // Broadcast to all subscribers
        io.to(`match:${parsed.data.matchId}`).emit('match:event', {
          event: matchEvent,
        });

        // Send acknowledgment to the reporting client
        socket.emit('sync:ack', {
          clientEventId: parsed.data.type,
          serverEventId: matchEvent.id,
          success: true,
        });
      } catch (err: any) {
        socket.emit('sync:ack', {
          success: false,
          error: err.message,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket() first.');
  }
  return io;
}
