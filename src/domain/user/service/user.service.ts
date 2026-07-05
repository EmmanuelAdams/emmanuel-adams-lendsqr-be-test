import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { db as knexDb } from '../../../common/database/knex';
import { ConflictError, ForbiddenError } from '../../../common/errors/app-error';
import { AdjutorClient } from '../../../integrations/adjutor/adjutor.client';
import { PasswordService } from '../../../common/auth/password.service';
import { TokenService } from '../../../common/auth/token.service';
import { generateAccountNumber } from '../../../common/utils/account-number.util';
import { WalletRepository } from '../../wallet/repository/wallet.repository';
import { toWalletResponse, type WalletResponse } from '../../wallet/types/wallet.types';
import { UserRepository } from '../repository/user.repository';
import { toUserResponse, type UserResponse } from '../types/user.types';
import type { RegisterDto } from '../dto/register.dto';

const MAX_ACCOUNT_NUMBER_ATTEMPTS = 5;

export interface RegisterResult {
  user: UserResponse;
  wallet: WalletResponse;
  token: string;
}

export class UserService {
  constructor(
    private readonly userRepo: UserRepository = new UserRepository(),
    private readonly walletRepo: WalletRepository = new WalletRepository(),
    private readonly adjutor: AdjutorClient = new AdjutorClient(),
    private readonly passwordService: PasswordService = new PasswordService(),
    private readonly tokenService: TokenService = new TokenService(),
    private readonly db: Knex = knexDb,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResult> {
    await this.assertNotBlacklisted(dto);
    await this.assertUnique(dto);

    const passwordHash = await this.passwordService.hash(dto.password);
    const accountNumber = await this.generateUniqueAccountNumber();

    const { user, wallet } = await this.db.transaction(async (trx) => {
      const createdUser = await this.userRepo.create(
        {
          id: randomUUID(),
          first_name: dto.firstName,
          last_name: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          password_hash: passwordHash,
        },
        trx,
      );

      const createdWallet = await this.walletRepo.create(
        { id: randomUUID(), user_id: createdUser.id, account_number: accountNumber },
        trx,
      );

      return { user: createdUser, wallet: createdWallet };
    });

    return {
      user: toUserResponse(user),
      wallet: toWalletResponse(wallet),
      token: this.tokenService.sign(user.id),
    };
  }

  private async assertNotBlacklisted(dto: RegisterDto): Promise<void> {
    if (await this.adjutor.lookupKarma(dto.phone)) {
      throw new ForbiddenError(
        'This phone number is on the Karma blacklist and cannot be onboarded.',
      );
    }
    if (await this.adjutor.lookupKarma(dto.email)) {
      throw new ForbiddenError('This email is on the Karma blacklist and cannot be onboarded.');
    }
  }

  private async assertUnique(dto: RegisterDto): Promise<void> {
    if (await this.userRepo.findByEmail(dto.email)) {
      throw new ConflictError('A user with this email already exists.');
    }
    if (await this.userRepo.findByPhone(dto.phone)) {
      throw new ConflictError('A user with this phone number already exists.');
    }
  }

  private async generateUniqueAccountNumber(): Promise<string> {
    for (let attempt = 0; attempt < MAX_ACCOUNT_NUMBER_ATTEMPTS; attempt += 1) {
      const candidate = generateAccountNumber();
      if (!(await this.walletRepo.findByAccountNumber(candidate))) {
        return candidate;
      }
    }
    throw new Error('Failed to generate a unique account number');
  }
}
