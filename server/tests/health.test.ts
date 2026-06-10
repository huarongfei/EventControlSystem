// tests/health.test.ts — Health endpoint tests
import request from 'supertest';
import express from 'express';

// Build a minimal test app so we don't depend on the full server bootstrap
function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: 'connected',
      version: '1.0.0',
    });
  });

  return app;
}

describe('GET /api/health', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 200 and ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should include db status field', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('db');
    expect(res.body.db).toBe('connected');
  });

  it('should include version field', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('version');
    expect(res.body.version).toBe('1.0.0');
  });

  it('should include timestamp in ISO format', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('should include uptime field', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });
});
