import { WalletService } from './wallet.service';
import { NotFoundError } from '../../common/errors/app-error';

describe('WalletService.getBalance', () => {
  it('returns the wallet for the user', async () => {
    const walletRepo = {
      findByUserId: jest.fn().mockResolvedValue({
        id: 'w1',
        user_id: 'u1',
        account_number: '1234567890',
        balance: 5000,
        currency: 'NGN',
      }),
    };
    const service = new WalletService(walletRepo as never);

    const result = await service.getBalance('u1');

    expect(result.accountNumber).toBe('1234567890');
    expect(result.balance).toBe(5000);
  });

  it('throws NotFoundError when the wallet is missing', async () => {
    const walletRepo = { findByUserId: jest.fn().mockResolvedValue(undefined) };
    const service = new WalletService(walletRepo as never);

    await expect(service.getBalance('u1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
