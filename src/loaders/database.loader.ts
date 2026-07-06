import knex, { type Knex } from 'knex';
import knexConfigs from '../config/database.config';
import { env } from '../config/env';
import { logger } from '../common/utils/logger';

const config = knexConfigs[env.nodeEnv];

if (!config) {
  throw new Error(`No Knex configuration found for NODE_ENV="${env.nodeEnv}"`);
}

export const db: Knex = knex(config);

export const connectDatabase = async (client: Knex = db): Promise<void> => {
  await client.raw('SELECT 1');
  logger.info('Database connection established');
};
