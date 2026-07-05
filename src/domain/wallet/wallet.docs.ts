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
import { withdrawSchema } from './dto/withdraw.dto';
import { transactionsQuerySchema } from './dto/transactions-query.dto';

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

registry.registerPath({
  method: 'post',
  path: '/api/v1/wallet/withdraw',
  tags: ['Wallet'],
  summary: 'Withdraw funds from the authenticated user wallet (amount in kobo)',
  security: [{ bearerAuth: [] }],
  request: {
    headers: idempotencyHeader,
    body: json(withdrawSchema.openapi({ example: { amount: 100000 } })),
  },
  responses: {
    200: {
      description: 'Withdrawal successful',
      ...json(
        successSchema(walletAndTransaction, {
          success: true,
          message: 'Withdrawal successful',
          data: {
            wallet: { ...examples.wallet, balance: 400000 },
            transaction: {
              ...examples.transaction,
              type: 'withdrawal',
              direction: 'debit',
              amount: 100000,
              balanceBefore: 500000,
              balanceAfter: 400000,
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
      description: 'Wallet not found',
      ...json(errorSchema(errorExample('Wallet not found'))),
    },
    422: {
      description: 'Insufficient funds or invalid request',
      ...json(errorSchema(errorExample('Insufficient funds'))),
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/wallet/transactions',
  tags: ['Wallet'],
  summary: 'List the authenticated user transaction history (paginated)',
  security: [{ bearerAuth: [] }],
  request: { query: transactionsQuerySchema },
  responses: {
    200: {
      description: 'Transactions retrieved',
      ...json(
        successSchema(
          z.object({
            transactions: z.array(dataSchemas.transaction),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
          {
            success: true,
            message: 'Transactions retrieved successfully',
            data: {
              transactions: [examples.transaction],
              meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
            },
          },
        ),
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
