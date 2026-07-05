import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1h'),

  ADJUTOR_BASE_URL: z.string().url().default('https://adjutor.lendsqr.com/v2'),
  ADJUTOR_API_KEY: z.string().min(1, 'ADJUTOR_API_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(
    `\nInvalid environment configuration:\n${issues}\n\nCheck your .env file against .env.example.\n`,
  );
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  port: raw.PORT,
  logLevel: raw.LOG_LEVEL,
  jwt: {
    secret: raw.JWT_SECRET,
    expiresIn: raw.JWT_EXPIRES_IN,
  },
  adjutor: {
    baseUrl: raw.ADJUTOR_BASE_URL,
    apiKey: raw.ADJUTOR_API_KEY,
  },
} as const;

export type Env = typeof env;
