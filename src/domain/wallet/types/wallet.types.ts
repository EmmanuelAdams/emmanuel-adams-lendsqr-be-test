export interface WalletRow {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewWallet {
  id: string;
  user_id: string;
  account_number: string;
}

export interface WalletResponse {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

export const toWalletResponse = (wallet: WalletRow): WalletResponse => ({
  id: wallet.id,
  accountNumber: wallet.account_number,
  balance: Number(wallet.balance),
  currency: wallet.currency,
});
