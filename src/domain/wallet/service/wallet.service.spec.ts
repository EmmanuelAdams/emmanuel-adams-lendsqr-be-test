import { WalletService } from './wallet.service';
import { NotFoundError, UnprocessableEntityError } from '../../../common/errors/app-error';

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
    findByAccountNumber: jest.fn(),
    findById: jest.fn(),
    lockByIds: jest.fn(),
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

    expect(walletRepo.findByUserIdForUpdate).toHaveBeenCalled();
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

  it('does not record an idempotency key when none is supplied', async () => {
    const { service, idempotencyRepo } = setup();

    await service.fund('u1', 5000);

    expect(idempotencyRepo.create).not.toHaveBeenCalled();
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

describe('WalletService.transfer', () => {
  const sender = {
    id: 'w1',
    user_id: 'u1',
    account_number: '1234567890',
    balance: 10000,
    currency: 'NGN',
  };
  const recipient = {
    id: 'w2',
    user_id: 'u2',
    account_number: '0987654321',
    balance: 0,
    currency: 'NGN',
  };

  const setup = () => {
    const ctx = makeService();
    ctx.walletRepo.findByUserId.mockResolvedValue({ ...sender });
    ctx.walletRepo.findByAccountNumber.mockResolvedValue({ ...recipient });
    ctx.walletRepo.lockByIds.mockResolvedValue([{ ...sender }, { ...recipient }]);
    ctx.transactionRepo.create.mockImplementation(async (data: Record<string, unknown>) => ({
      ...data,
      metadata: null,
      created_at: new Date(),
    }));
    return ctx;
  };

  it('debits the sender, credits the recipient, and writes two ledger rows', async () => {
    const { service, walletRepo, transactionRepo } = setup();

    const result = await service.transfer('u1', '0987654321', 3000);

    expect(walletRepo.lockByIds).toHaveBeenCalledWith(['w1', 'w2'], expect.anything());
    expect(walletRepo.updateBalance).toHaveBeenCalledWith('w1', 7000, expect.anything());
    expect(walletRepo.updateBalance).toHaveBeenCalledWith('w2', 3000, expect.anything());
    expect(result.wallet.balance).toBe(7000);
    expect(result.transaction.type).toBe('transfer');
    expect(result.transaction.direction).toBe('debit');
    expect(transactionRepo.create).toHaveBeenCalledTimes(2);
  });

  it('rejects a transfer that exceeds the balance', async () => {
    const { service, walletRepo } = setup();
    walletRepo.lockByIds.mockResolvedValue([{ ...sender, balance: 1000 }, { ...recipient }]);

    await expect(service.transfer('u1', '0987654321', 5000)).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );
    expect(walletRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('rejects a transfer to an unknown account', async () => {
    const { service, walletRepo } = setup();
    walletRepo.findByAccountNumber.mockResolvedValue(undefined);

    await expect(service.transfer('u1', '0000000000', 3000)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a transfer to your own wallet', async () => {
    const { service, walletRepo } = setup();
    walletRepo.findByAccountNumber.mockResolvedValue({ ...sender });

    await expect(service.transfer('u1', '1234567890', 3000)).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );
  });
});
