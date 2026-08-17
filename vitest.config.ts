import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Live-network integration tests run separately (npm run test:integration).
    exclude: ['node_modules/**', 'dist/**', 'evidence/**', 'test/**/*.integration.test.ts'],
  },
});