import type { Knex } from 'knex';
import { db as knexDb } from '../../common/database/knex';
import type { NewUser, UserRow } from './user.types';

export class UserRepository {
  constructor(private readonly db: Knex = knexDb) {}

  async findByEmail(email: string, executor: Knex = this.db): Promise<UserRow | undefined> {
    return executor<UserRow>('users').where({ email }).first();
  }

  async findByPhone(phone: string, executor: Knex = this.db): Promise<UserRow | undefined> {
    return executor<UserRow>('users').where({ phone }).first();
  }

  async create(data: NewUser, executor: Knex = this.db): Promise<UserRow> {
    await executor('users').insert(data);
    const user = await executor<UserRow>('users').where({ id: data.id }).first();
    return user as UserRow;
  }
}
