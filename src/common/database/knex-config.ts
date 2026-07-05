import 'dotenv/config';
import type { Knex } from 'knex';

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'demo_credit',
  DATABASE_URL,
  DB_SSL,
  DB_SSL_REJECT_UNAUTHORIZED,
  DB_CA_CERT,
} = process.env;

const buildSsl = (): { rejectUnauthorized: boolean; ca?: string } | undefined => {
  if (DB_SSL !== 'true') return undefined;

  const ssl: { rejectUnauthorized: boolean; ca?: string } = {
    rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  if (DB_CA_CERT) {
    ssl.ca = Buffer.from(DB_CA_CERT, 'base64').toString('utf8');
  }

  return ssl;
};

const buildConnection = (database: string): Knex.Config['connection'] => {
  if (DATABASE_URL) return DATABASE_URL;
  return {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database,
    ssl: buildSsl(),
  };
};

const shared: Knex.Config = {
  client: 'mysql2',
  pool: { min: 2, max: 10 },
  migrations: {
    directory: './src/common/database/migrations',
    extension: 'ts',
    tableName: 'knex_migrations',
  },
};

const knexConfigs: Record<string, Knex.Config> = {
  development: {
    ...shared,
    connection: buildConnection(DB_NAME),
  },
  test: {
    ...shared,
    connection: buildConnection(`${DB_NAME}_test`),
    pool: { min: 0, max: 5 },
  },
  production: {
    ...shared,
    connection: buildConnection(DB_NAME),
    pool: { min: 2, max: 20 },
  },
};

export default knexConfigs;
