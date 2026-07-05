import { z } from 'zod';

export const transferSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/, 'accountNumber must be a 10-digit account number'),
  amount: z.number().int().positive(),
});

export type TransferDto = z.infer<typeof transferSchema>;
