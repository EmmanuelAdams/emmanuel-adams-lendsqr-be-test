import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import { apiRouter } from './routes';
import { openApiDocument } from './docs/openapi';
import { SuccessResponse } from './common/api/response/success-response';
import { env } from './config/env';
import { httpLogger } from './common/utils/logger';
import { processingTime } from './common/middleware/processing-time.middleware';
import { apiRateLimiter } from './common/middleware/rate-limit.middleware';
import { notFoundHandler } from './common/middleware/not-found.middleware';
import { errorHandler } from './common/middleware/error.middleware';

const corsOptions: CorsOptions = env.corsOrigins ? { origin: env.corsOrigins } : {};

export const createApp = (): Application => {
  const app = express();

  app.disable('x-powered-by');
  app.use(processingTime);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);

  app.get('/', (_req: Request, res: Response) => {
    res
      .status(StatusCodes.OK)
      .json(
        new SuccessResponse(
          { name: 'Demo Credit Wallet API', version: '1.0.0', health: '/api/v1/health' },
          'Welcome to the Demo Credit wallet service',
        ),
      );
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument()));

  app.use('/api/v1', apiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
