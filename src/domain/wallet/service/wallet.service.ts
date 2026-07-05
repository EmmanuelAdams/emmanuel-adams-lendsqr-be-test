import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { db as knexDb } from '../../../common/database/knex';
import { NotFoundError } from '../../../common/errors/app-error';
import { isUniqueViolation } from '../../../common/database/db-error.util';
import { IdempotencyRepository } from '../../../common/idempotency/idempotency.repository';
import { TransactionRepository } from '../../transaction/repository/transaction.repository';
import {
  toTransactionResponse,
  type TransactionResponse,
} from '../../transaction/types/transaction.types';
import { WalletRepository } from '../repository/wallet.repository';
import { toWalletResponse, type WalletResponse } from '../types/wallet.types';

export interface WalletMutationResult {
  wallet: WalletResponse;
  transaction: TransactionResponse;
}

export class WalletService {
  constructor(
    private readonly walletRepo: WalletRepository = new WalletRepository(),
    private readonly transactionRepo: TransactionRepository = new TransactionRepository(),
    private readonly idempotencyRepo: IdempotencyRepository = new IdempotencyRepository(),
    private readonly db: Knex = knexDb,
  ) {}

  async getBalance(userId: string): Promise<WalletResponse> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }
    return toWalletResponse(wallet);
  }

  async fund(
    userId: string,
    amount: number,
    idempotencyKey?: string,
  ): Promise<WalletMutationResult> {
    const replayed = await this.findReplay(idempotencyKey);
    if (replayed) {
      return replayed;
    }

    const reference = randomUUID();
    try {
      return await this.db.transaction(async (trx) => {
        await this.recordIdempotency(idempotencyKey, userId, reference, trx);

        const wallet = await this.walletRepo.findByUserIdForUpdate(userId, trx);
        if (!wallet) {
          throw new NotFoundError('Wallet not found');
        }

        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore + amount;
        await this.walletRepo.updateBalance(wallet.id, balanceAfter, trx);

        const transaction = await this.transactionRepo.create(
          {
            id: randomUUID(),
            wallet_id: wallet.id,
            type: 'funding',
            direction: 'credit',
            amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            reference,
          },
          trx,
        );

        return {
          wallet: toWalletResponse({ ...wallet, balance: balanceAfter }),
          transaction: toTransactionResponse(transaction),
        };
      });
    } catch (error) {
      const conflictReplay = await this.findReplayOnConflict(error, idempotencyKey);
      if (conflictReplay) {
        return conflictReplay;
      }
      throw error;
    }
  }

  private async findReplay(idempotencyKey?: string): Promise<WalletMutationResult | null> {
    if (!idempotencyKey) {
      return null;
    }
    const existing = await this.idempotencyRepo.findByKey(idempotencyKey);
    return existing ? this.replay(existing.resource_reference) : null;
  }

  private async findReplayOnConflict(
    error: unknown,
    idempotencyKey?: string,
  ): Promise<WalletMutationResult | null> {
    if (idempotencyKey && isUniqueViolation(error)) {
      return this.findReplay(idempotencyKey);
    }
    return null;
  }

  private async recordIdempotency(
    idempotencyKey: string | undefined,
    userId: string,
    reference: string,
    trx: Knex,
  ): Promise<void> {
    if (!idempotencyKey) {
      return;
    }
    await this.idempotencyRepo.create(
      {
        id: randomUUID(),
        idempotency_key: idempotencyKey,
        user_id: userId,
        resource_reference: reference,
      },
      trx,
    );
  }

  private async replay(reference: string): Promise<WalletMutationResult> {
    const [transaction] = await this.transactionRepo.findByReference(reference);
    if (!transaction) {
      throw new NotFoundError('Original transaction not found');
    }
    const wallet = await this.walletRepo.findById(transaction.wallet_id);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }
    return {
      wallet: toWalletResponse({ ...wallet, balance: Number(transaction.balance_after) }),
      transaction: toTransactionResponse(transaction),
    };
  }
}
