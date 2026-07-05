import type { Knex } from 'knex';
import { db as knexDb } from '../../../common/database/knex';
import type { NewTransaction, TransactionRow } from '../types/transaction.types';

export class TransactionRepository {
  constructor(private readonly db: Knex = knexDb) {}

  async create(data: NewTransaction, executor: Knex = this.db): Promise<TransactionRow> {
    const { metadata, counterparty_wallet_id, ...rest } = data;
    await executor('transactions').insert({
      ...rest,
      counterparty_wallet_id: counterparty_wallet_id ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
    const created = await executor<TransactionRow>('transactions').where({ id: data.id }).first();
    return created as TransactionRow;
  }

  async findByReference(reference: string, executor: Knex = this.db): Promise<TransactionRow[]> {
    return executor<TransactionRow>('transactions')
      .where({ reference })
      .orderBy('created_at', 'asc');
  }
}
