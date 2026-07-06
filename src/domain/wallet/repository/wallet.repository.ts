import type { Knex } from 'knex';
import { db as knexDb } from '../../../loaders/database.loader';
import type { NewWallet, WalletRow } from '../types/wallet.types';

export class WalletRepository {
  constructor(private readonly db: Knex = knexDb) {}

  async create(data: NewWallet, executor: Knex = this.db): Promise<WalletRow> {
    await executor('wallets').insert(data);
    const wallet = await executor<WalletRow>('wallets').where({ id: data.id }).first();
    return wallet as WalletRow;
  }

  async findByAccountNumber(
    accountNumber: string,
    executor: Knex = this.db,
  ): Promise<WalletRow | undefined> {
    return executor<WalletRow>('wallets').where({ account_number: accountNumber }).first();
  }

  async findByUserId(userId: string, executor: Knex = this.db): Promise<WalletRow | undefined> {
    return executor<WalletRow>('wallets').where({ user_id: userId }).first();
  }

  async findById(id: string, executor: Knex = this.db): Promise<WalletRow | undefined> {
    return executor<WalletRow>('wallets').where({ id }).first();
  }

  async findByUserIdForUpdate(userId: string, executor: Knex): Promise<WalletRow | undefined> {
    return executor<WalletRow>('wallets').where({ user_id: userId }).forUpdate().first();
  }

  async lockByIds(ids: string[], executor: Knex): Promise<WalletRow[]> {
    return executor<WalletRow>('wallets').whereIn('id', ids).orderBy('id', 'asc').forUpdate();
  }

  async updateBalance(id: string, balance: number, executor: Knex): Promise<void> {
    await executor('wallets').where({ id }).update({ balance, updated_at: executor.fn.now() });
  }
}
