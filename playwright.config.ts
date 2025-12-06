import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test and override any existing environment variables
dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
  override: true,
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'html',

  /* Global teardown - clean up test data after all tests */
  globalTeardown: './e2e/global-teardown.ts',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry */
    video: 'retain-on-failure',
  },

  /* Configure projects for Chromium only as per guidelines */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Pass all test environment variables to the dev server
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_KEY: process.env.SUPABASE_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      E2E_USERNAME: process.env.E2E_USERNAME || '',
      E2E_PASSWORD: process.env.E2E_PASSWORD || '',
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || '',
      NODE_ENV: 'test',
    },
  },
});
