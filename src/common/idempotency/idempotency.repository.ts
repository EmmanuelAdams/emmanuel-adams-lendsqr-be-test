import type { Knex } from 'knex';
import { db as knexDb } from '../database/knex';

export interface IdempotencyRow {
  id: string;
  idempotency_key: string;
  user_id: string;
  resource_reference: string;
  created_at: Date;
}

export interface NewIdempotencyKey {
  id: string;
  idempotency_key: string;
  user_id: string;
  resource_reference: string;
}

export class IdempotencyRepository {
  constructor(private readonly db: Knex = knexDb) {}

  async findByKey(key: string, executor: Knex = this.db): Promise<IdempotencyRow | undefined> {
    return executor<IdempotencyRow>('idempotency_keys').where({ idempotency_key: key }).first();
  }

  async create(data: NewIdempotencyKey, executor: Knex = this.db): Promise<void> {
    await executor('idempotency_keys').insert(data);
  }
}
