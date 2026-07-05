import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{10}$/, 'phone must be a valid 11-digit Nigerian number (e.g. 08012345678)'),
  password: z.string().min(8).max(100),
});

export type RegisterDto = z.infer<typeof registerSchema>;
