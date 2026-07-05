import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../errors/app-error';

export interface AuthTokenPayload {
  sub: string;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication token is missing or malformed'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret) as AuthTokenPayload;
    req.userId = payload.sub;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};
