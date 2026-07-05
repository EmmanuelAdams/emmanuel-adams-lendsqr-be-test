import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SuccessResponse } from '../../common/api/response/success-response';

export class HealthController {
  public check = (_req: Request, res: Response): void => {
    res.status(StatusCodes.OK).json(
      new SuccessResponse(
        {
          status: 'ok',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        'Service is healthy',
      ),
    );
  };
}
