import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../../common/utils/async-handler';
import { SuccessResponse } from '../../../common/api/response/success-response';
import { UnauthorizedError } from '../../../common/errors/app-error';
import { fundSchema } from '../dto/fund.dto';
import { transferSchema } from '../dto/transfer.dto';
import { withdrawSchema } from '../dto/withdraw.dto';
import { transactionsQuerySchema } from '../dto/transactions-query.dto';
import { WalletService } from '../service/wallet.service';

export class WalletController {
  constructor(private readonly walletService: WalletService = new WalletService()) {}

  getBalance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const wallet = await this.walletService.getBalance(userId);
    res.status(StatusCodes.OK).json(new SuccessResponse(wallet, 'Wallet retrieved successfully'));
  });

  fund = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { amount } = fundSchema.parse(req.body);
    const idempotencyKey = req.header('Idempotency-Key');
    const result = await this.walletService.fund(userId, amount, idempotencyKey);
    res.status(StatusCodes.OK).json(new SuccessResponse(result, 'Wallet funded successfully'));
  });

  transfer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { accountNumber, amount } = transferSchema.parse(req.body);
    const idempotencyKey = req.header('Idempotency-Key');
    const result = await this.walletService.transfer(userId, accountNumber, amount, idempotencyKey);
    res.status(StatusCodes.OK).json(new SuccessResponse(result, 'Transfer successful'));
  });

  withdraw = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const { amount } = withdrawSchema.parse(req.body);
    const idempotencyKey = req.header('Idempotency-Key');
    const result = await this.walletService.withdraw(userId, amount, idempotencyKey);
    res.status(StatusCodes.OK).json(new SuccessResponse(result, 'Withdrawal successful'));
  });

  getTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = transactionsQuerySchema.parse(req.query);
    const result = await this.walletService.getTransactions(userId, query);
    res
      .status(StatusCodes.OK)
      .json(new SuccessResponse(result, 'Transactions retrieved successfully'));
  });

  private requireUserId(req: Request): string {
    if (!req.userId) {
      throw new UnauthorizedError();
    }
    return req.userId;
  }
}
