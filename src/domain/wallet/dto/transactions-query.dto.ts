import { z } from 'zod';

export const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['funding', 'withdrawal', 'transfer']).optional(),
  direction: z.enum(['credit', 'debit']).optional(),
});

export type TransactionsQueryDto = z.infer<typeof transactionsQuerySchema>;
