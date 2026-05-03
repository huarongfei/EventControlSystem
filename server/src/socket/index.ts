import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { matchService } from '../services/match.service';
import { matchTimerService } from '../services/match-timer.service';
import logger from '../utils/logger';

let io: SocketIOServer;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
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
    socket.on('match:join', async (data: { matchId: string }) => {
      try {
        const matchId = typeof data === 'string' ? data : data.matchId;
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
    socket.on('match:leave', (data: { matchId: string }) => {
      const matchId = typeof data === 'string' ? data : data.matchId;
      socket.leave(`match:${matchId}`);
      logger.info(`Socket ${socket.id} left match room: ${matchId}`);
    });

    // ─── 计时器控制 ───────────────────────────────────────
    // 客户端请求启动/恢复计时
    socket.on('timer:start', async (data: { matchId: string }) => {
      try {
        const match = await matchService.getById(data.matchId);
        if ((match as any).status !== 'running') {
          await matchService.updateStatus(data.matchId, { status: 'running' });
        }
        socket.emit('timer:ack', { success: true, action: 'start' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'start', error: err.message });
      }
    });

    // 客户端请求暂停计时
    socket.on('timer:pause', async (data: { matchId: string }) => {
      try {
        const match = await matchService.getById(data.matchId);
        if ((match as any).status !== 'paused') {
          await matchService.updateStatus(data.matchId, { status: 'paused' });
        }
        socket.emit('timer:ack', { success: true, action: 'pause' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'pause', error: err.message });
      }
    });

    // 客户端请求重置计时（到当前节的初始时间）
    socket.on('timer:reset', async (data: { matchId: string; period?: number }) => {
      try {
        const match = await matchService.getById(data.matchId);
        const m = match as any;
        const period = data.period ?? m.currentPeriod;
        const periodDuration = m.periodDuration ?? 10;
        matchTimerService.resetToPeriod(data.matchId, period, periodDuration, m.sportType ?? 'basketball');
        socket.emit('timer:ack', { success: true, action: 'reset' });
      } catch (err: any) {
        socket.emit('timer:ack', { success: false, action: 'reset', error: err.message });
      }
    });

    // 客户端汇报事件（Android 裁判端）
    socket.on('client:report', async (data: {
      matchId: string;
      type: string;
      period: number;
      teamId?: string;
      playerId?: string;
      detail?: Record<string, unknown>;
      reportedBy?: string;
    }) => {
      try {
        const matchEvent = await matchService.addEvent(data.matchId, {
          ...data,
          reportedBy: data.reportedBy || socket.id,
        });

        // Broadcast to all subscribers
        io.to(`match:${data.matchId}`).emit('match:event', {
          event: matchEvent,
        });

        // Send acknowledgment to the reporting client
        socket.emit('sync:ack', {
          clientEventId: data.type,
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
