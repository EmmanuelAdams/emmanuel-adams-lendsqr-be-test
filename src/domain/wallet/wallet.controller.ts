import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../common/utils/async-handler';
import { SuccessResponse } from '../../common/api/response/success-response';
import { UnauthorizedError } from '../../common/errors/app-error';
import { WalletService } from './wallet.service';

export class WalletController {
  constructor(private readonly walletService: WalletService = new WalletService()) {}

  getBalance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }
    const wallet = await this.walletService.getBalance(userId);
    res.status(StatusCodes.OK).json(new SuccessResponse(wallet, 'Wallet retrieved successfully'));
  });
}
