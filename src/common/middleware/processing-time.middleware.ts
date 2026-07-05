import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';

export const processingTime = (_req: Request, res: Response, next: NextFunction): void => {
  if (env.isProduction) {
    next();
    return;
  }

  const start = process.hrtime.bigint();
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      (body as Record<string, unknown>).processingTime = `${elapsedMs.toFixed(2)}ms`;
    }
    return originalJson(body);
  }) as Response['json'];

  next();
};
