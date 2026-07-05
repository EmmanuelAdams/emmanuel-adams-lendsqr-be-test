import type { Knex } from 'knex';
import { db } from '../common/database/knex';
import { logger } from '../common/utils/logger';

export const connectDatabase = async (knex: Knex = db): Promise<void> => {
  await knex.raw('SELECT 1');
  logger.info('Database connection established');
};
