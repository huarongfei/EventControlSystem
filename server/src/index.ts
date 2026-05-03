import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(requestId);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/events', eventController);
app.use('/api/matches', matchController);
app.use('/api/sports', sportController);
app.use('/api/teams', teamController);
app.use('/api/broadcast', broadcastController);
app.use('/api/sync', syncController);
app.use('/api/foul-types', foulTypeController);

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO
initSocket(server);

// Start server
server.listen(config.port, () => {
  logger.info(`ECS Server running on port ${config.port}`);
  logger.info(`WebSocket: ws://localhost:${config.port}/socket.io`);
  logger.info(`CORS: ${config.corsOrigin}`);
  logger.info(`Env: ${config.nodeEnv}`);
});

export { app, server };
