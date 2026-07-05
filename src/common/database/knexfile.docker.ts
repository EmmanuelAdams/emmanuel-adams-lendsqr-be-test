import type { Knex } from 'knex';
import knexConfigs from './knex-config';

// Container config: migrations run from the compiled JS so the runtime needs no ts-node.
const environment = process.env.NODE_ENV ?? 'production';
const base = knexConfigs[environment] ?? knexConfigs.production;

if (!base) {
  throw new Error(`No Knex configuration found for NODE_ENV="${environment}"`);
}

const dockerConfig: Knex.Config = {
  ...base,
  migrations: {
    directory: `${__dirname}/migrations`,
    extension: 'js',
    loadExtensions: ['.js'],
    tableName: 'knex_migrations',
  },
};

export default dockerConfig;
