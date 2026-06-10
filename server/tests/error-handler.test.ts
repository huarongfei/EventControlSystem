// tests/error-handler.test.ts — Error handler middleware tests
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler';
import { AppError } from '../src/utils/AppError';

function createAppWithErrorHandler() {
  const app = express();
  app.use(express.json());

  // Route that throws a standard Error
  app.get('/err/standard', () => {
    throw new Error('Something went wrong');
  });

  // Route that throws an AppError
  app.get('/err/app', () => {
    throw new AppError(404, 'NOT_FOUND', 'Resource not found');
  });

  // Route that throws an AppError with status 422
  app.get('/err/validation', () => {
    throw new AppError(422, 'INVALID_INPUT', 'Invalid input');
  });

  // Route that returns normally
  app.get('/ok', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorHandler);

  return app;
}

describe('Error Handler Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createAppWithErrorHandler();
  });

  it('should return 500 for unknown errors', async () => {
    const res = await request(app).get('/err/standard');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for AppError with not-found code', async () => {
    const res = await request(app).get('/err/app');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('should return 422 for AppError with validation code', async () => {
    const res = await request(app).get('/err/validation');
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('INVALID_INPUT');
  });

  it('should not interfere with normal responses', async () => {
    const res = await request(app).get('/ok');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
