import { z } from 'zod';

export const fundSchema = z.object({
  amount: z.number().int().positive(),
});

export type FundDto = z.infer<typeof fundSchema>;
