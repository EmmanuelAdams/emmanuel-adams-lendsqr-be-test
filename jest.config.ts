import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  setupFiles: ['<rootDir>/src/test/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/jest.teardown.ts'],
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/test/**',
    '!src/database/migrations/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

export default config;
