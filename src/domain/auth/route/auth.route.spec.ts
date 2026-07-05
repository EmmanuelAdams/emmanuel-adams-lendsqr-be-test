import request from 'supertest';
import { createApp } from '../../../app';

describe('auth routes (integration)', () => {
  const app = createApp();

  it('rejects registration with an invalid body (422)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects login without a password (422)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ada@example.com' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
