export type TransactionType = 'funding' | 'withdrawal' | 'transfer';
export type TransactionDirection = 'credit' | 'debit';

export interface TransactionRow {
  id: string;
  wallet_id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  balance_before: number;
  balance_after: number;
  counterparty_wallet_id: string | null;
  reference: string;
  metadata: unknown;
  created_at: Date;
}

export interface NewTransaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  balance_before: number;
  balance_after: number;
  counterparty_wallet_id?: string | null;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  createdAt: Date;
}

export const toTransactionResponse = (transaction: TransactionRow): TransactionResponse => ({
  id: transaction.id,
  type: transaction.type,
  direction: transaction.direction,
  amount: Number(transaction.amount),
  balanceBefore: Number(transaction.balance_before),
  balanceAfter: Number(transaction.balance_after),
  reference: transaction.reference,
  createdAt: transaction.created_at,
});
