import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'cd ../server && OTEL_ENABLED=false PORT=3100 STATIC_DIR=../web/dist node dist/index.js',
    url: 'http://localhost:3100/healthz',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
