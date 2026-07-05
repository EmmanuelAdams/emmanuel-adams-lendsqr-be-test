import request from 'supertest';
import { createApp } from './app';

describe('app', () => {
  const app = createApp();

  it('serves a welcome payload at the root', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Demo Credit Wallet API');
    expect(res.body.data.health).toBe('/api/v1/health');
  });

  it('includes processingTime in the response body', async () => {
    const res = await request(app).get('/');

    expect(res.body.processingTime).toMatch(/^\d+(\.\d+)?ms$/);
  });
});
