import { z } from 'zod';
import {
  registry,
  dataSchemas,
  examples,
  successSchema,
  errorSchema,
  errorExample,
  json,
  sampleToken,
} from '../../docs/registry';
import { registerSchema } from '../user/dto/register.dto';
import { loginSchema } from './dto/login.dto';

const registerExample = {
  firstName: 'Emmanuel',
  lastName: 'Adams',
  email: 'emmanuel.adams@example.com',
  phone: '08031234567',
  password: 'Password123',
};

const loginExample = { email: registerExample.email, password: 'Password123' };

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
            data: { user: examples.user, wallet: examples.wallet, token: sampleToken },
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
