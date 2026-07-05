import { AuthService } from './auth.service';
import { UnauthorizedError } from '../../../common/errors/app-error';
import type { LoginDto } from '../dto/login.dto';

const dto: LoginDto = { email: 'ada@example.com', password: 'password123' };

const makeService = () => {
  const userRepo = { findByEmail: jest.fn() };
  const passwordService = { verify: jest.fn(), hash: jest.fn() };
  const tokenService = { sign: jest.fn().mockReturnValue('jwt.token'), verify: jest.fn() };
  const service = new AuthService(
    userRepo as never,
    passwordService as never,
    tokenService as never,
  );
  return { service, userRepo, passwordService, tokenService };
};

describe('AuthService.login', () => {
  it('returns a token for valid credentials', async () => {
    const { service, userRepo, passwordService } = makeService();
    userRepo.findByEmail.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    passwordService.verify.mockResolvedValue(true);

    const result = await service.login(dto);

    expect(result.token).toBe('jwt.token');
  });

  it('rejects an unknown email with UnauthorizedError', async () => {
    const { service, userRepo } = makeService();
    userRepo.findByEmail.mockResolvedValue(undefined);

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a wrong password with UnauthorizedError', async () => {
    const { service, userRepo, passwordService } = makeService();
    userRepo.findByEmail.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    passwordService.verify.mockResolvedValue(false);

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
