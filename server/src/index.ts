/**
 * EventControlSystem - Web Backend Server
 * 
 * Author: Huafeirong (https://github.com/huarongfei)
 * Project: https://github.com/huarongfei/EventControlSystem
 * Copyright © 2026 Huafeirong. All rights reserved.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config';
import { eventController } from './controllers/event.controller';
import { matchController } from './controllers/match.controller';
import { teamController } from './controllers/team.controller';
import { sportController } from './controllers/sport.controller';
import { broadcastController } from './controllers/broadcast.controller';
import { syncController } from './controllers/sync.controller';
import foulTypeController from './controllers/foul-type.controller';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { initSocket } from './socket';
import logger from './utils/logger';
import { prisma } from './utils/prisma';

const app = express();
const server = createServer(app);

// Middleware
// 安全头（启用 CSP，仅允许同域 + Swagger UI CDN）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      styleSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://unpkg.com"],
    },
  },
}));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(requestId);

// 速率限制（15分钟窗口内最多100个请求/IP）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api/', limiter);

// Health check（含数据库连接状态）
app.get('/api/health', async (_req, res) => {
  let dbStatus: 'connected' | 'error' = 'error';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: dbStatus,
    version: '1.0.0',
  });
});

// OpenAPI spec
app.get('/api/openapi.json', (_req, res) => {
  res.sendFile('openapi.json', { root: 'docs' });
});

// Swagger UI（CDN 渲染）
app.get('/api/docs', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>ECS API 文档 — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>html{box-sizing:border-box;overflow-y:scroll}*,::before,::after{box-sizing:inherit}body{margin:0;background:#fafafa}.topbar{display:none}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui', deepLinking: true, defaultModelsExpandDepth: -1 });
  </script>
</body>
</html>`);
});

// Routes
app.use('/api/events', eventController);
app.use('/api/matches', matchController);
app.use('/api/sports', sportController);
app.use('/api/teams', teamController);
app.use('/api/broadcast', broadcastController);
app.use('/api/sync', syncController);
app.use('/api/foul-types', foulTypeController);

// Catch-all 404 for unmatched API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${_req.method} ${_req.originalUrl} does not exist`,
    code: 'ENDPOINT_NOT_FOUND',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO
initSocket(server);

// Start server
// ─── 启动前环境变量校验 ──────────────────────────
const requiredEnvVars: string[] = ['DATABASE_URL'];
const missingVars: string[] = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) missingVars.push(envVar);
}
if (missingVars.length > 0) {
  logger.error(`[Startup] Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('[Server] Cannot start. Please check your .env configuration.');
  process.exit(1);
}

if (config.nodeEnv === 'production' && !process.env.JWT_SECRET) {
  logger.error('[Startup] JWT_SECRET is required in production mode');
  process.exit(1);
}

logger.info(`[Startup] Environment validation passed (env=${config.nodeEnv})`);

server.listen(config.port, () => {
  logger.info(`ECS Server running on port ${config.port}`);
  logger.info(`WebSocket: ws://localhost:${config.port}/socket.io`);
  logger.info(`Swagger UI: http://localhost:${config.port}/api/docs`);
  logger.info(`CORS: ${config.corsOrigin}`);
  logger.info(`Env: ${config.nodeEnv}`);
});

export { app, server };
