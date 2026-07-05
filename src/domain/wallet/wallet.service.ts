import { NotFoundError } from '../../common/errors/app-error';
import { WalletRepository } from './wallet.repository';
import { toWalletResponse, type WalletResponse } from './wallet.types';

export class WalletService {
  constructor(private readonly walletRepo: WalletRepository = new WalletRepository()) {}

  async getBalance(userId: string): Promise<WalletResponse> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }
    return toWalletResponse(wallet);
  }
}
