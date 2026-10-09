import { defineConfig } from 'vitest/config';
import { randomBytes } from 'node:crypto';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.js'],
    globalSetup: ['./src/tests/globalSetup.js'],
    setupFiles: ['./src/tests/setup.js'],
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: '',
      MONGODB_TEST_URI: '',
      JWT_SECRET: randomBytes(32).toString('hex'),
      APP_ORIGIN: 'http://localhost:5173',
    },
  },
});
