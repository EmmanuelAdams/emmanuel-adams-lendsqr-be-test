import { z } from 'zod';

export const withdrawSchema = z.object({
  amount: z.number().int().positive(),
});

export type WithdrawDto = z.infer<typeof withdrawSchema>;
