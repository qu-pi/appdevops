import { defineConfig, devices } from '@playwright/test'

// BASE_URL points at the environment under test - the CD workflow sets it
// to the preprod URL before running this suite. Defaults to local dev so
// `npx playwright test` also works on a laptop against `npm run dev`.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
