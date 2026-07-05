import knex, { type Knex } from 'knex';
import knexConfigs from './knex-config';
import { env } from '../../config/env';

const config: Knex.Config | undefined = knexConfigs[env.nodeEnv];

if (!config) {
  throw new Error(`No Knex configuration found for NODE_ENV="${env.nodeEnv}"`);
}

export const db: Knex = knex(config);
