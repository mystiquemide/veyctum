import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.integration.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'evidence/**'],
    testTimeout: 25000,
    hookTimeout: 25000,
  },
});