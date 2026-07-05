import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { ErrorResponse } from '../api/response/error-response';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(StatusCodes.UNPROCESSABLE_ENTITY)
      .json(new ErrorResponse('Validation failed', err.flatten().fieldErrors));
    return;
  }

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json(new ErrorResponse(err.message, err.details));
    return;
  }

  logger.error({ err }, 'Unhandled error');
  const message = env.isProduction ? 'Internal server error' : (err as Error).message;
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(new ErrorResponse(message));
};
