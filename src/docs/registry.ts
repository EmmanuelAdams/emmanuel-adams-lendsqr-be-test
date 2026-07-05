import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

export const sampleToken = '<jwt-token>';

export const dataSchemas = {
  user: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
    createdAt: z.string(),
  }),
  wallet: z.object({
    id: z.string().uuid(),
    accountNumber: z.string(),
    balance: z.number(),
    currency: z.string(),
  }),
  transaction: z.object({
    id: z.string().uuid(),
    type: z.string(),
    direction: z.string(),
    amount: z.number(),
    balanceBefore: z.number(),
    balanceAfter: z.number(),
    reference: z.string(),
    createdAt: z.string(),
  }),
};

export const examples = {
  user: {
    id: '9b1c8f2a-4d3e-4a7b-8c6d-2e1f0a9b8c7d',
    firstName: 'Emmanuel',
    lastName: 'Adams',
    email: 'emmanuel.adams@example.com',
    phone: '08031234567',
    createdAt: '2026-07-05T09:19:57.000Z',
  },
  wallet: {
    id: '3a2b1c0d-5e4f-4a3b-9c8d-7e6f5a4b3c2d',
    accountNumber: '3081947265',
    balance: 0,
    currency: 'NGN',
  },
  transaction: {
    id: 'b7c6d5e4-3f2a-4b1c-9d8e-6f5a4b3c2d1e',
    type: 'funding',
    direction: 'credit',
    amount: 500000,
    balanceBefore: 0,
    balanceAfter: 500000,
    reference: 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    createdAt: '2026-07-05T09:20:00.000Z',
  },
};

export const successSchema = (data: z.ZodTypeAny, example: unknown) =>
  z
    .object({ success: z.literal(true), message: z.string(), data })
    .openapi({ example: example as never });

export const errorSchema = (example: unknown) =>
  z
    .object({
      success: z.literal(false),
      message: z.string(),
      errors: z.record(z.array(z.string())).optional(),
    })
    .openapi({ example: example as never });

export const errorExample = (message: string, errors?: Record<string, string[]>) => ({
  success: false,
  message,
  ...(errors ? { errors } : {}),
});

export const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });

export const idempotencyHeader = z.object({
  'Idempotency-Key': z.string().uuid().optional(),
});
