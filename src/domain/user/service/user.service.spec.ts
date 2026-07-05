import { UserService } from './user.service';
import { ConflictError, ForbiddenError } from '../../../common/errors/app-error';
import type { RegisterDto } from '../dto/register.dto';

const dto: RegisterDto = {
  firstName: 'Ada',
  lastName: 'Eze',
  email: 'ada@example.com',
  phone: '08012345678',
  password: 'password123',
};

const makeService = () => {
  const userRepo = {
    findByEmail: jest.fn().mockResolvedValue(undefined),
    findByPhone: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(async (data: Record<string, unknown>) => ({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  };
  const walletRepo = {
    findByAccountNumber: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(async (data: Record<string, unknown>) => ({
      ...data,
      balance: 0,
      currency: 'NGN',
      created_at: new Date(),
      updated_at: new Date(),
    })),
  };
  const adjutor = { lookupKarma: jest.fn().mockResolvedValue(null) };
  const passwordService = {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    verify: jest.fn(),
  };
  const tokenService = { sign: jest.fn().mockReturnValue('signed.jwt.token'), verify: jest.fn() };
  const db = { transaction: jest.fn(async (cb: (trx: unknown) => unknown) => cb({})) };

  const service = new UserService(
    userRepo as never,
    walletRepo as never,
    adjutor as never,
    passwordService as never,
    tokenService as never,
    db as never,
  );

  return { service, userRepo, walletRepo, adjutor, passwordService, tokenService };
};

describe('UserService.register', () => {
  it('creates a user and wallet and returns a token for a clean, unique applicant', async () => {
    const { service, walletRepo } = makeService();

    const result = await service.register(dto);

    expect(result.token).toBe('signed.jwt.token');
    expect(result.user.email).toBe(dto.email);
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.wallet.accountNumber).toHaveLength(10);
    expect(result.wallet.balance).toBe(0);
    expect(walletRepo.create).toHaveBeenCalledTimes(1);
  });

  it('checks the phone against Karma in international format', async () => {
    const { service, adjutor } = makeService();

    await service.register(dto);

    expect(adjutor.lookupKarma).toHaveBeenCalledWith('+2348012345678');
    expect(adjutor.lookupKarma).toHaveBeenCalledTimes(1);
  });

  it('rejects a blacklisted phone and never creates a user', async () => {
    const { service, adjutor, userRepo } = makeService();
    adjutor.lookupKarma.mockImplementation(async (id: string) =>
      id === '+2348012345678' ? { karma_identity: id } : null,
    );

    await expect(service.register(dto)).rejects.toBeInstanceOf(ForbiddenError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email with a ConflictError', async () => {
    const { service, userRepo } = makeService();
    userRepo.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a duplicate phone with a ConflictError', async () => {
    const { service, userRepo } = makeService();
    userRepo.findByPhone.mockResolvedValue({ id: 'existing' });

    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictError);
  });
});
