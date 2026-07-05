import { z } from 'zod';
import {
  registry,
  dataSchemas,
  examples,
  successSchema,
  errorSchema,
  errorExample,
  json,
  idempotencyHeader,
} from '../../docs/registry';
import { fundSchema } from './dto/fund.dto';
import { transferSchema } from './dto/transfer.dto';

const walletAndTransaction = z.object({
  wallet: dataSchemas.wallet,
  transaction: dataSchemas.transaction,
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
          data: examples.wallet,
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

registry.registerPath({
  method: 'post',
  path: '/api/v1/wallet/fund',
  tags: ['Wallet'],
  summary: 'Fund the authenticated user wallet (amount in kobo)',
  security: [{ bearerAuth: [] }],
  request: {
    headers: idempotencyHeader,
    body: json(fundSchema.openapi({ example: { amount: 500000 } })),
  },
  responses: {
    200: {
      description: 'Wallet funded',
      ...json(
        successSchema(walletAndTransaction, {
          success: true,
          message: 'Wallet funded successfully',
          data: {
            wallet: { ...examples.wallet, balance: 500000 },
            transaction: examples.transaction,
          },
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
    422: {
      description: 'Validation failed',
      ...json(
        errorSchema(errorExample('Validation failed', { amount: ['Expected a positive integer'] })),
      ),
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/wallet/transfer',
  tags: ['Wallet'],
  summary: 'Transfer funds to another user by account number (amount in kobo)',
  security: [{ bearerAuth: [] }],
  request: {
    headers: idempotencyHeader,
    body: json(
      transferSchema.openapi({ example: { accountNumber: '0123456789', amount: 250000 } }),
    ),
  },
  responses: {
    200: {
      description: 'Transfer successful',
      ...json(
        successSchema(walletAndTransaction, {
          success: true,
          message: 'Transfer successful',
          data: {
            wallet: { ...examples.wallet, balance: 250000 },
            transaction: {
              ...examples.transaction,
              type: 'transfer',
              direction: 'debit',
              amount: 250000,
              balanceBefore: 500000,
              balanceAfter: 250000,
            },
          },
        }),
      ),
    },
    401: {
      description: 'Unauthorized',
      ...json(errorSchema(errorExample('Authentication token is missing or malformed'))),
    },
    404: {
      description: 'Recipient account not found',
      ...json(errorSchema(errorExample('Recipient account not found'))),
    },
    422: {
      description: 'Insufficient funds or invalid request',
      ...json(errorSchema(errorExample('Insufficient funds'))),
    },
  },
});
