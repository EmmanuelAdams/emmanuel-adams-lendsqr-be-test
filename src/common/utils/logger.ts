import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../../config/env';

export const logger = pino({
  level: env.logLevel,
  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
  redact: {
    paths: ['req.headers.authorization', 'password', '*.password'],
    censor: '[redacted]',
  },
});

export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
