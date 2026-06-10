import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as any).requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`[req:${requestId}] [${err.code}] ${err.message}`);
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { requestId }),
    });
    return;
  }

  // 未知错误 — 生产环境不泄露内部细节
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'An unexpected error occurred';

  logger.error(`[req:${requestId}] Unexpected error: ${err.stack || err.message}`);

  const response: Record<string, unknown> = {
    error: 'INTERNAL_ERROR',
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.requestId = requestId;
  }

  res.status(500).json(response);
}
