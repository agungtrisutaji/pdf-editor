import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    channel: 'msedge', // Use local Edge to avoid downloading Playwright browsers
  },
  projects: [
    {
      name: 'Desktop Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
});
