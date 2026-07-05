import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registerSchema } from '../domain/user/dto/register.dto';
import { loginSchema } from '../domain/auth/dto/login.dto';

extendZodWithOpenApi(z);

const sampleToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMWIyYzNkNCJ9.6Q3s0m8Vd9pQ2rY7wZ1kX';

const registerExample = {
  firstName: 'Emmanuel',
  lastName: 'Adams',
  email: 'emmanuel.adams@example.com',
  phone: '08031234567',
  password: 'Password123',
};

const loginExample = { email: registerExample.email, password: 'Password123' };

const userExample = {
  id: '9b1c8f2a-4d3e-4a7b-8c6d-2e1f0a9b8c7d',
  firstName: registerExample.firstName,
  lastName: registerExample.lastName,
  email: registerExample.email,
  phone: registerExample.phone,
  createdAt: '2026-07-05T09:19:57.000Z',
};

const walletExample = {
  id: '3a2b1c0d-5e4f-4a3b-9c8d-7e6f5a4b3c2d',
  accountNumber: '3081947265',
  balance: 0,
  currency: 'NGN',
};

const dataSchemas = {
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
};

const successSchema = (data: z.ZodTypeAny, example: unknown) =>
  z
    .object({ success: z.literal(true), message: z.string(), data })
    .openapi({ example: example as never });

const errorSchema = (example: unknown) =>
  z
    .object({
      success: z.literal(false),
      message: z.string(),
      errors: z.record(z.array(z.string())).optional(),
    })
    .openapi({ example: example as never });

const errorExample = (message: string, errors?: Record<string, string[]>) => ({
  success: false,
  message,
  ...(errors ? { errors } : {}),
});

const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Auth'],
  summary: 'Create an account',
  request: { body: json(registerSchema.openapi({ example: registerExample })) },
  responses: {
    201: {
      description: 'Account created',
      ...json(
        successSchema(
          z.object({ user: dataSchemas.user, wallet: dataSchemas.wallet, token: z.string() }),
          {
            success: true,
            message: 'Account created successfully',
            data: { user: userExample, wallet: walletExample, token: sampleToken },
          },
        ),
      ),
    },
    403: {
      description: 'Identity is on the Karma blacklist',
      ...json(
        errorSchema(
          errorExample('This phone number is on the Karma blacklist and cannot be onboarded.'),
        ),
      ),
    },
    409: {
      description: 'Email or phone already in use',
      ...json(errorSchema(errorExample('A user with this email already exists.'))),
    },
    422: {
      description: 'Validation failed',
      ...json(errorSchema(errorExample('Validation failed', { email: ['Invalid email'] }))),
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  summary: 'Log in and receive a token',
  request: { body: json(loginSchema.openapi({ example: loginExample })) },
  responses: {
    200: {
      description: 'Login successful',
      ...json(
        successSchema(z.object({ token: z.string() }), {
          success: true,
          message: 'Login successful',
          data: { token: sampleToken },
        }),
      ),
    },
    401: {
      description: 'Invalid credentials',
      ...json(errorSchema(errorExample('Invalid email or password'))),
    },
    422: {
      description: 'Validation failed',
      ...json(errorSchema(errorExample('Validation failed', { password: ['Required'] }))),
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/wallet',
  tags: ['Wallet'],
  summary: 'Get the authenticated user wallet and balance',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Wallet retrieved',
      ...json(
        successSchema(dataSchemas.wallet, {
          success: true,
          message: 'Wallet retrieved successfully',
          data: walletExample,
        }),
      ),
    },
    401: {
      description: 'Unauthorized',
      ...json(errorSchema(errorExample('Authentication token is missing or malformed'))),
    },
    404: {
      description: 'Wallet not found',
      ...json(errorSchema(errorExample('Wallet not found'))),
    },
  },
});

export const openApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Demo Credit Wallet API',
      version: '1.0.0',
      description: 'MVP wallet service for a mobile lending app. Amounts are in kobo.',
    },
    servers: [{ url: '/', description: 'Current host' }],
  });
};
