import request from 'supertest';
import { createApp } from '../../../app';
import { TokenService } from '../../../common/auth/token.service';

describe('wallet routes (integration)', () => {
  const app = createApp();
  const token = new TokenService().sign('00000000-0000-4000-8000-000000000000');

  it('returns 401 for the balance endpoint without a token', async () => {
    const res = await request(app).get('/api/v1/wallet');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for funding without a token', async () => {
    const res = await request(app).post('/api/v1/wallet/fund').send({ amount: 5000 });

    expect(res.status).toBe(401);
  });

  it('returns 422 for funding with an invalid amount', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/fund')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -100 });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
