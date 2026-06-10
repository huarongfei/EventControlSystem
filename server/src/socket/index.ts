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
import { checkRateLimit, checkConnectionLimit, onDisconnect, startCleanup, stopCleanup } from './security';
import { setTimerService } from '../index';

let io: SocketIOServer;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.socketCorsOrigin || config.corsOrigin,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    // 连接数限制（全局）
    maxHttpBufferSize: 1e6, // 1MB 消息大小限制
  });

  // 启动安全清理定时器
  startCleanup(io);

  // 把 Socket.IO 实例注入计时器服务
  matchTimerService.setIO(io);

  // 向 index 注入计时器服务引用（供 shutdown 使用）
  setTimerService(matchTimerService);

  // 恢复所有运行中的计时器（服务器刚启动时）
  matchTimerService.recoverTimers(io).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[Timer] Failed to recover timers: ${msg}`);
  });

  io.on('connection', (socket: Socket) => {
    // ─── 连接安全检查 ──────────────
    if (!checkConnectionLimit(socket)) {
      logger.warn(`[Security] Rejected connection from ${socket.handshake.address}: too many connections`);
      socket.disconnect(true);
      return;
    }

    logger.info(`[Socket] Connected: ${socket.id} from ${socket.handshake.address} (total: ${io.sockets.sockets.size})`);

    // Join a match room
    socket.on('match:join', async (data: unknown) => {
      if (!checkRateLimit(socket)) {
        socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }
      const parsed = MatchJoinSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid match:join payload', details: parsed.error.issues });
        return;
      }
      try {
        const matchId = typeof parsed.data === 'string' ? parsed.data : parsed.data.matchId;
        await matchService.getById(matchId);
        socket.join(`match:${matchId}`);
        logger.info(`[Socket] ${socket.id} joined match room: ${matchId}`);

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
      logger.info(`[Socket] ${socket.id} left match room: ${matchId}`);
    });

    // ─── 计时器控制 ───────────────────────────────────────
    // 客户端请求启动/恢复计时
    socket.on('timer:start', async (data: unknown) => {
      if (!checkRateLimit(socket)) {
        socket.emit('timer:ack', { success: false, action: 'start', error: 'Rate limit exceeded' });
        return;
      }
      const parsed = TimerStartSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('timer:ack', { success: false, action: 'start', error: 'Invalid payload', details: parsed.error.issues });
        return;
      }
      try {
        const match = await matchService.getById(parsed.data.matchId);
        const currentStatus = (match as Record<string, unknown>).status as string ?? 'not_started';
        if (!['running', 'live'].includes(currentStatus)) {
          await matchService.updateStatus(parsed.data.matchId, { status: 'running' });
        }
        socket.emit('timer:ack', { success: true, action: 'start' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'start', error: err.message });
      }
    });

    // 客户端请求暂停计时
    socket.on('timer:pause', async (data: unknown) => {
      if (!checkRateLimit(socket)) {
        socket.emit('timer:ack', { success: false, action: 'pause', error: 'Rate limit exceeded' });
        return;
      }
      const parsed = TimerPauseSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('timer:ack', { success: false, action: 'pause', error: 'Invalid payload', details: parsed.error.issues });
        return;
      }
      try {
        const match = await matchService.getById(parsed.data.matchId);
        const currentStatus = (match as Record<string, unknown>).status as string ?? 'not_started';
        if (['running', 'live'].includes(currentStatus)) {
          await matchService.updateStatus(parsed.data.matchId, { status: 'paused' });
        }
        socket.emit('timer:ack', { success: true, action: 'pause' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'pause', error: err.message });
      }
    });

    // 客户端请求重置计时（到当前节的初始时间）
    socket.on('timer:reset', async (data: unknown) => {
      if (!checkRateLimit(socket)) {
        socket.emit('timer:ack', { success: false, action: 'reset', error: 'Rate limit exceeded' });
        return;
      }
      const parsed = TimerResetSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('timer:ack', { success: false, action: 'reset', error: 'Invalid payload', details: parsed.error.issues });
        return;
      }
      try {
        const match = await matchService.getById(parsed.data.matchId);
        const m = match as Record<string, unknown>;
        const period = parsed.data.period ?? (m.currentPeriod as number) ?? 1;
        const periodDuration = (m.periodDuration as number) ?? 10;
        const sportType = (m.sportType as string) ?? 'basketball';
        matchTimerService.resetToPeriod(parsed.data.matchId, period, periodDuration, sportType);
        socket.emit('timer:ack', { success: true, action: 'reset' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'reset', error: err.message });
      }
    });

    // 客户端汇报事件（Android/HarmonyOS 裁判端）
    socket.on('client:report', async (data: unknown) => {
      if (!checkRateLimit(socket)) {
        socket.emit('sync:ack', { success: false, error: 'Rate limit exceeded' });
        return;
      }
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
          // Only use client-provided identifier; socket.id is ephemeral and useless for auditing
          reportedBy: parsed.data.reportedBy || null,
        });

        // Broadcast to all subscribers
        io.to(`match:${parsed.data.matchId}`).emit('match:event', {
          event: matchEvent,
        });

        // Send acknowledgment to the reporting client
        socket.emit('sync:ack', {
          clientEventId: (parsed.data as Record<string, unknown>).clientEventId ?? `${parsed.data.matchId}:${Date.now()}`,
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

    // Handle disconnect — 清理连接计数
    socket.on('disconnect', (reason: string) => {
      onDisconnect(socket);
      logger.info(`[Socket] Disconnected: ${socket.id}, reason: ${reason}`);
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

export { stopCleanup };
