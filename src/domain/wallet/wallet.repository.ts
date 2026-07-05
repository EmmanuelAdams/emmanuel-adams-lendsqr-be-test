import type { Knex } from 'knex';
import { db as knexDb } from '../../common/database/knex';
import type { NewWallet, WalletRow } from './wallet.types';

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
}
