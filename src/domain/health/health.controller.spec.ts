import request from 'supertest';
import { createApp } from '../../app';

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('returns a healthy status envelope', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Service is healthy' });
    expect(res.body.data.status).toBe('ok');
  });

  it('returns a not-found envelope for an unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
