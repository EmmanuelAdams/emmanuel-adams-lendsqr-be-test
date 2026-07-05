import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { db as knexDb } from '../../../common/database/knex';
import { NotFoundError, UnprocessableEntityError } from '../../../common/errors/app-error';
import { isUniqueViolation } from '../../../common/database/db-error.util';
import { IdempotencyRepository } from '../../../common/idempotency/idempotency.repository';
import { TransactionRepository } from '../../transaction/repository/transaction.repository';
import {
  toTransactionResponse,
  type TransactionResponse,
} from '../../transaction/types/transaction.types';
import { WalletRepository } from '../repository/wallet.repository';
import { toWalletResponse, type WalletResponse } from '../types/wallet.types';
import type { TransactionsQueryDto } from '../dto/transactions-query.dto';

export interface WalletMutationResult {
  wallet: WalletResponse;
  transaction: TransactionResponse;
}

export interface TransactionHistory {
  transactions: TransactionResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
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

  async getTransactions(userId: string, query: TransactionsQueryDto): Promise<TransactionHistory> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    const { page, limit, type, direction } = query;
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.transactionRepo.findByWalletId(wallet.id, { limit, offset, type, direction }),
      this.transactionRepo.countByWalletId(wallet.id, { type, direction }),
    ]);

    return {
      transactions: rows.map(toTransactionResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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

  async transfer(
    userId: string,
    recipientAccountNumber: string,
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

        const sender = await this.walletRepo.findByUserId(userId, trx);
        if (!sender) {
          throw new NotFoundError('Wallet not found');
        }
        const recipient = await this.walletRepo.findByAccountNumber(recipientAccountNumber, trx);
        if (!recipient) {
          throw new NotFoundError('Recipient account not found');
        }
        if (sender.id === recipient.id) {
          throw new UnprocessableEntityError('You cannot transfer to your own wallet');
        }

        const locked = await this.walletRepo.lockByIds([sender.id, recipient.id], trx);
        const lockedSender = locked.find((wallet) => wallet.id === sender.id);
        const lockedRecipient = locked.find((wallet) => wallet.id === recipient.id);
        if (!lockedSender || !lockedRecipient) {
          throw new NotFoundError('Wallet not found');
        }

        const senderBefore = Number(lockedSender.balance);
        if (senderBefore < amount) {
          throw new UnprocessableEntityError('Insufficient funds');
        }
        const senderAfter = senderBefore - amount;
        const recipientBefore = Number(lockedRecipient.balance);
        const recipientAfter = recipientBefore + amount;

        await this.walletRepo.updateBalance(lockedSender.id, senderAfter, trx);
        await this.walletRepo.updateBalance(lockedRecipient.id, recipientAfter, trx);

        const senderDebit = await this.transactionRepo.create(
          {
            id: randomUUID(),
            wallet_id: lockedSender.id,
            type: 'transfer',
            direction: 'debit',
            amount,
            balance_before: senderBefore,
            balance_after: senderAfter,
            counterparty_wallet_id: lockedRecipient.id,
            reference,
          },
          trx,
        );
        await this.transactionRepo.create(
          {
            id: randomUUID(),
            wallet_id: lockedRecipient.id,
            type: 'transfer',
            direction: 'credit',
            amount,
            balance_before: recipientBefore,
            balance_after: recipientAfter,
            counterparty_wallet_id: lockedSender.id,
            reference,
          },
          trx,
        );

        return {
          wallet: toWalletResponse({ ...lockedSender, balance: senderAfter }),
          transaction: toTransactionResponse(senderDebit),
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

  async withdraw(
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
        if (balanceBefore < amount) {
          throw new UnprocessableEntityError('Insufficient funds');
        }
        const balanceAfter = balanceBefore - amount;
        await this.walletRepo.updateBalance(wallet.id, balanceAfter, trx);

        const transaction = await this.transactionRepo.create(
          {
            id: randomUUID(),
            wallet_id: wallet.id,
            type: 'withdrawal',
            direction: 'debit',
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
