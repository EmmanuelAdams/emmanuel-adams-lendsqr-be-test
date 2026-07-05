import rateLimit from 'express-rate-limit';
import { ErrorResponse } from '../api/response/error-response';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: new ErrorResponse('Too many requests, please try again later.'),
});

export const financialRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: new ErrorResponse('Too many financial requests, please slow down.'),
});
