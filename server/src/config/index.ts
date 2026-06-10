import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 应用配置（带类型安全和默认值）
 *
 * 必需环境变量：
 *   DATABASE_URL   - Prisma 数据库连接字符串
 *   JWT_SECRET     - JWT 签名密钥（生产环境必须设置）
 *
 * 可选环境变量（有默认值）：
 *   PORT           - 服务端口（默认 3001）
 *   NODE_ENV       - 运行环境（默认 development）
 *   CORS_ORIGIN    - 允许的跨域来源（默认 localhost:5173）
 *   LOG_LEVEL      - 日志级别（默认 info）
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}. ` +
      `Please set it in your .env file or environment.`
    );
  }
  return value;
}

function parsePort(raw: string | undefined, fallback: number): number {
  const parsed = parseInt(raw || String(fallback), 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`[Config] Invalid PORT value: "${raw}". Must be between 1 and 65535.`);
  }
  return parsed;
}

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

export const config = {
  // ─── 服务器 ──────────────────────
  port: parsePort(process.env.PORT, 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,

  // ─── 数据库 ──────────────────────
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // ─── 安全 ────────────────────────
  jwtSecret: isProduction ? requireEnv('JWT_SECRET') : (process.env.JWT_SECRET || 'dev-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || (isProduction ? false : 'http://localhost:5173'),

  // ─── 日志 ────────────────────────
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info'),

  // ─── Socket.IO ───────────────────
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || (isProduction ? false : '*'),

  // ─── 前端 URL（用于邮件链接等）───
  appUrl: process.env.APP_URL || 'http://localhost:5173',
} as const;

// 启动时输出关键配置摘要（不输出敏感值）
logger.info(`[Config] PORT=${config.port}, NODE_ENV=${config.nodeEnv}, DB=${config.databaseUrl.substring(0, 20)}...`);
