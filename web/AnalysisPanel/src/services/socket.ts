// ============================================================
// ECS 赛况分析面板 - Socket.IO 服务
// ============================================================

import { io, Socket } from 'socket.io-client';
import type { ScoreUpdatePayload, MatchEventPayload, MatchStatusPayload, ConnectionStatus } from '@/types';
import config from '@/config';

class SocketService {
  public socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(config.socketUrl, {
      path: config.socketPath,
      transports: [...config.socketTransports],
      reconnection: true,
      reconnectionAttempts: config.socketReconnection.attempts,
      reconnectionDelay: config.socketReconnection.delay,
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /** 监听比分更新 */
  onScoreUpdate(callback: (data: ScoreUpdatePayload) => void): () => void {
    return this.on('match:score_update', callback);
  }

  /** 监听比赛事件 */
  onMatchEvent(callback: (data: MatchEventPayload) => void): () => void {
    return this.on('match:event', callback);
  }

  /** 监听比赛状态变更 */
  onStatusChange(callback: (data: MatchStatusPayload) => void): () => void {
    return this.on('match:status_change', callback);
  }

  /** 监听比赛时钟更新（竞速赛用） */
  onMatchClock(callback: (data: { matchId: string; gameClock: string; currentPeriod: number; status: string }) => void): () => void {
    return this.on('match:clock', callback);
  }

  /** 监听选手成绩更新（竞速赛用） */
  onParticipantUpdate(callback: (data: { matchId: string; participantId: string; finalTime?: string; rank?: number; status?: string }) => void): () => void {
    return this.on('race:participant_update', callback);
  }

  /** 监听连接状态变化 */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.ensureSocket();

    const handleConnect = () => callback('connected');
    const handleDisconnect = () => callback('disconnected');
    const handleReconnectAttempt = () => callback('reconnecting');

    this.socket!.on('connect', handleConnect);
    this.socket!.on('disconnect', handleDisconnect);
    this.socket!.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      this.socket?.off('connect', handleConnect);
      this.socket?.off('disconnect', handleDisconnect);
      this.socket?.off('reconnect_attempt', handleReconnectAttempt);
    };
  }

  /** 加入比赛房间 */
  joinMatch(matchId: string): void {
    this.ensureSocket();
    this.socket!.emit('match:join', { matchId });
  }

  /** 离开比赛房间 */
  leaveMatch(matchId: string): void {
    this.ensureSocket();
    this.socket!.emit('match:leave', { matchId });
  }

  /** 获取当前连接状态 */
  getStatus(): ConnectionStatus {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  private ensureSocket(): void {
    if (!this.socket) {
      this.connect();
    }
  }

  private on<T>(event: string, callback: (data: T) => void): () => void {
    this.ensureSocket();
    this.socket!.on(event, callback as (...args: unknown[]) => void);

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (...args: unknown[]) => void);

    return () => {
      this.socket?.off(event, callback as (...args: unknown[]) => void);
      this.listeners.get(event)?.delete(callback as (...args: unknown[]) => void);
    };
  }
}

export const socketService = new SocketService();
export default socketService;
