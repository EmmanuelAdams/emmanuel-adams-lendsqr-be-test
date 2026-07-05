import type { Knex } from 'knex';
import { db as knexDb } from '../../../common/database/knex';
import type {
  NewTransaction,
  TransactionDirection,
  TransactionRow,
  TransactionType,
} from '../types/transaction.types';

export interface TransactionFilters {
  type?: TransactionType;
  direction?: TransactionDirection;
}

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

  async findByWalletId(
    walletId: string,
    options: { limit: number; offset: number } & TransactionFilters,
    executor: Knex = this.db,
  ): Promise<TransactionRow[]> {
    const query = executor<TransactionRow>('transactions').where({ wallet_id: walletId });
    if (options.type) query.where({ type: options.type });
    if (options.direction) query.where({ direction: options.direction });
    return query.orderBy('created_at', 'desc').limit(options.limit).offset(options.offset);
  }

  async countByWalletId(
    walletId: string,
    filters: TransactionFilters = {},
    executor: Knex = this.db,
  ): Promise<number> {
    const query = executor('transactions').where({ wallet_id: walletId });
    if (filters.type) query.where({ type: filters.type });
    if (filters.direction) query.where({ direction: filters.direction });
    const result = await query.count({ total: '*' });
    return Number(result[0]?.total ?? 0);
  }
}
