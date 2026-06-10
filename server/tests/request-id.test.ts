// tests/request-id.test.ts — Request ID middleware tests
import request from 'supertest';
import express from 'express';
import { requestId } from '../src/middleware/requestId';

function createAppWithRequestId() {
  const app = express();
  app.use(express.json());
  app.use(requestId);

  app.get('/api/test', (req, res) => {
    res.json({
      generatedId: req.requestId,
      message: 'ok',
    });
  });

  return app;
}

describe('Request ID Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createAppWithRequestId();
  });

  it('should generate a UUID v4 request ID for each request', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.body.generatedId).toBeDefined();
    expect(typeof res.body.generatedId).toBe('string');
    // UUID v4 format: 8-4-4-4-12 hex digits
    expect(res.body.generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should generate unique IDs for different requests', async () => {
    const res1 = await request(app).get('/api/test');
    const res2 = await request(app).get('/api/test');
    expect(res1.body.generatedId).not.toBe(res2.body.generatedId);
  });
});
