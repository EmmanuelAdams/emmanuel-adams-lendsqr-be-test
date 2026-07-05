import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { db } from './common/database/knex';
import { logger } from './common/utils/logger';

const start = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to the database, shutting down');
    process.exit(1);
  }

  const app = createApp();
  const server: Server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, closing server gracefully`);
    server.close(() => {
      void db.destroy().then(() => {
        logger.info('Resources released, exiting');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

void start();
