import request from 'supertest';

const mockGetBalance = jest.fn();
const mockFund = jest.fn();

jest.mock('../service/wallet.service', () => ({
  WalletService: jest.fn().mockImplementation(() => ({
    getBalance: mockGetBalance,
    fund: mockFund,
    transfer: jest.fn(),
    withdraw: jest.fn(),
    getTransactions: jest.fn(),
  })),
}));

import { createApp } from '../../../app';
import { TokenService } from '../../../common/auth/token.service';

describe('wallet routes (integration)', () => {
  const app = createApp();
  const token = new TokenService().sign('00000000-0000-4000-8000-000000000000');

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('returns 200 and the wallet balance for an authenticated request', async () => {
    mockGetBalance.mockResolvedValue({
      id: 'w1',
      accountNumber: '1234567890',
      balance: 5000,
      currency: 'NGN',
    });

    const res = await request(app).get('/api/v1/wallet').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(5000);
    expect(mockGetBalance).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000000');
  });

  it('returns 200 and forwards the idempotency key when funding a valid amount', async () => {
    mockFund.mockResolvedValue({
      wallet: { id: 'w1', accountNumber: '1234567890', balance: 10000, currency: 'NGN' },
      transaction: {
        id: 't1',
        type: 'funding',
        direction: 'credit',
        amount: 5000,
        balanceAfter: 10000,
      },
    });

    const res = await request(app)
      .post('/api/v1/wallet/fund')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'key-123')
      .send({ amount: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.wallet.balance).toBe(10000);
    expect(mockFund).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000000', 5000, 'key-123');
  });
});
