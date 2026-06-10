import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';

// ─── 速率限制配置 ──────────────────
const RATE_LIMIT_WINDOW_MS = 10_000; // 10秒窗口
const RATE_LIMIT_MAX_EVENTS = 30;    // 每窗口最大事件数

interface ClientRateData {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, ClientRateData>();

/**
 * 检查客户端是否超出速率限制
 * 返回 true 表示允许，false 表示被限制
 */
export function checkRateLimit(socket: Socket): boolean {
  const key = socket.handshake.address;
  const now = Date.now();
  const data = rateLimitMap.get(key);

  if (!data || now > data.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  data.count++;
  if (data.count > RATE_LIMIT_MAX_EVENTS) {
    logger.warn(`[Security] Rate limit exceeded for ${key}: ${data.count}/${RATE_LIMIT_MAX_EVENTS}`);
    return false;
  }
  return true;
}

// ─── 连接数限制 ────────────────────
const MAX_CONNECTIONS_PER_IP = 5;
const connectionCountMap = new Map<string, number>();

/**
 * 检查IP连接数是否超限
 */
export function checkConnectionLimit(socket: Socket): boolean {
  const ip = socket.handshake.address;
  const current = connectionCountMap.get(ip) || 0;

  if (current >= MAX_CONNECTIONS_PER_IP) {
    logger.warn(`[Security] Connection limit exceeded for ${ip}: ${current}/${MAX_CONNECTIONS_PER_IP}`);
    return false;
  }

  connectionCountMap.set(ip, current + 1);
  return true;
}

/**
 * 清理断开连接的计数
 */
export function onDisconnect(socket: Socket): void {
  const ip = socket.handshake.address;
  const current = connectionCountMap.get(ip) || 0;
  if (current <= 1) {
    connectionCountMap.delete(ip);
  } else {
    connectionCountMap.set(ip, current - 1);
  }

  // 清理该 IP 的速率限制数据（使用 address 作为 key，与 checkRateLimit 一致）
  rateLimitMap.delete(ip);
}

// ─── 定期清理过期数据 ──────────────
const CLEANUP_INTERVAL_MS = 60_000; // 每分钟清理一次

let cleanupTimerId: ReturnType<typeof setInterval> | null = null;

export function startCleanup(io: SocketIOServer): void {
  cleanupTimerId = setInterval(() => {
    const now = Date.now();

    // 清理过期的速率限制数据
    for (const [key, data] of rateLimitMap.entries()) {
      if (now > data.resetAt) {
        rateLimitMap.delete(key);
      }
    }

    // 日志：当前连接数
    const connCount = io.sockets.sockets.size;
    logger.debug(`[Security] Cleanup complete. Active sockets: ${connCount}, Tracked IPs: ${connectionCountMap.size}`);
  }, CLEANUP_INTERVAL_MS);
}

/** 停止安全清理定时器（供 shutdown 调用） */
export function stopCleanup(): void {
  if (cleanupTimerId !== null) {
    clearInterval(cleanupTimerId);
    cleanupTimerId = null;
    logger.info('[Security] Cleanup timer stopped');
  }
}
