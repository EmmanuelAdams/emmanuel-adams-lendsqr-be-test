import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors/app-error';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
