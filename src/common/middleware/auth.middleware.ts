import type { NextFunction, Request, Response } from 'express';
import { TokenService } from '../auth/token.service';
import { UnauthorizedError } from '../errors/app-error';

const tokenService = new TokenService();

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication token is missing or malformed'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = tokenService.verify(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};
