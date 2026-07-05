import { UnauthorizedError } from '../../common/errors/app-error';
import { PasswordService } from '../../common/auth/password.service';
import { TokenService } from '../../common/auth/token.service';
import { UserRepository } from '../user/user.repository';
import type { LoginDto } from './dto/login.dto';

export interface LoginResult {
  token: string;
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository = new UserRepository(),
    private readonly passwordService: PasswordService = new PasswordService(),
    private readonly tokenService: TokenService = new TokenService(),
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await this.passwordService.verify(user.password_hash, dto.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { token: this.tokenService.sign(user.id) };
  }
}
