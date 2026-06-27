import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 30000,
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
