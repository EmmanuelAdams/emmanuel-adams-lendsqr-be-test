import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiRouter } from './routes';
import { httpLogger } from './common/utils/logger';
import { apiRateLimiter } from './common/middleware/rate-limit.middleware';
import { notFoundHandler } from './common/middleware/not-found.middleware';
import { errorHandler } from './common/middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);

  app.use('/api/v1', apiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
