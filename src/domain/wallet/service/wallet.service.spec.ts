import { WalletService } from './wallet.service';
import { NotFoundError } from '../../../common/errors/app-error';

const wallet = {
  id: 'w1',
  user_id: 'u1',
  account_number: '1234567890',
  balance: 1000,
  currency: 'NGN',
};

const makeService = () => {
  const walletRepo = {
    findByUserId: jest.fn(),
    findByUserIdForUpdate: jest.fn(),
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };
  const transactionRepo = { create: jest.fn(), findByReference: jest.fn() };
  const idempotencyRepo = { findByKey: jest.fn().mockResolvedValue(undefined), create: jest.fn() };
  const db = { transaction: jest.fn(async (cb: (trx: unknown) => unknown) => cb({})) };
  const service = new WalletService(
    walletRepo as never,
    transactionRepo as never,
    idempotencyRepo as never,
    db as never,
  );
  return { service, walletRepo, transactionRepo, idempotencyRepo, db };
};

describe('WalletService.getBalance', () => {
  it('returns the wallet for the user', async () => {
    const { service, walletRepo } = makeService();
    walletRepo.findByUserId.mockResolvedValue({ ...wallet, balance: 2500 });

    const result = await service.getBalance('u1');

    expect(result.accountNumber).toBe('1234567890');
    expect(result.balance).toBe(2500);
  });

  it('throws NotFoundError when the wallet is missing', async () => {
    const { service, walletRepo } = makeService();
    walletRepo.findByUserId.mockResolvedValue(undefined);

    await expect(service.getBalance('u1')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('WalletService.fund', () => {
  const setup = () => {
    const ctx = makeService();
    ctx.walletRepo.findByUserIdForUpdate.mockResolvedValue({ ...wallet });
    ctx.transactionRepo.create.mockImplementation(async (data: Record<string, unknown>) => ({
      ...data,
      metadata: null,
      counterparty_wallet_id: null,
      created_at: new Date(),
    }));
    return ctx;
  };

  it('credits the wallet and records a funding transaction', async () => {
    const { service, walletRepo, transactionRepo } = setup();

    const result = await service.fund('u1', 5000);

    expect(walletRepo.updateBalance).toHaveBeenCalledWith('w1', 6000, expect.anything());
    expect(result.wallet.balance).toBe(6000);
    expect(result.transaction.type).toBe('funding');
    expect(result.transaction.direction).toBe('credit');
    expect(result.transaction.amount).toBe(5000);
    expect(transactionRepo.create).toHaveBeenCalledTimes(1);
  });

  it('records the idempotency key when one is supplied', async () => {
    const { service, idempotencyRepo } = setup();

    await service.fund('u1', 5000, 'key-123');

    expect(idempotencyRepo.create).toHaveBeenCalledTimes(1);
  });

  it('replays the original result for a repeated key without re-funding', async () => {
    const { service, idempotencyRepo, transactionRepo, walletRepo, db } = setup();
    idempotencyRepo.findByKey.mockResolvedValue({ resource_reference: 'ref-1' });
    transactionRepo.findByReference.mockResolvedValue([
      {
        id: 't1',
        wallet_id: 'w1',
        type: 'funding',
        direction: 'credit',
        amount: 5000,
        balance_before: 1000,
        balance_after: 6000,
        reference: 'ref-1',
        created_at: new Date(),
      },
    ]);
    walletRepo.findById.mockResolvedValue({ ...wallet, balance: 6000 });

    const result = await service.fund('u1', 5000, 'key-123');

    expect(result.transaction.balanceAfter).toBe(6000);
    expect(db.transaction).not.toHaveBeenCalled();
    expect(walletRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the wallet does not exist', async () => {
    const { service, walletRepo } = makeService();
    walletRepo.findByUserIdForUpdate.mockResolvedValue(undefined);

    await expect(service.fund('u1', 5000)).rejects.toBeInstanceOf(NotFoundError);
  });
});
