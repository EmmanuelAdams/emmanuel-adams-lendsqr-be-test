import request from 'supertest';

const mockRegister = jest.fn();
const mockLogin = jest.fn();

jest.mock('../../user/service/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({ register: mockRegister })),
}));

jest.mock('../service/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({ login: mockLogin })),
}));

import { createApp } from '../../../app';

describe('auth routes (integration)', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('registers a new user and returns 201 with a token', async () => {
    mockRegister.mockResolvedValue({
      user: { id: 'u1', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' },
      wallet: { id: 'w1', accountNumber: '1234567890', balance: 0, currency: 'NGN' },
      token: 'signed-jwt',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '08012345678',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('signed-jwt');
  });

  it('logs in an existing user and returns 200 with a token', async () => {
    mockLogin.mockResolvedValue({
      user: { id: 'u1', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' },
      token: 'signed-jwt',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'ada@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('signed-jwt');
  });
});
