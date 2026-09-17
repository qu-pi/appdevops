import { test, expect } from '@playwright/test'

test('health check responds', async ({ request, baseURL }) => {
  const res = await request.get(new URL('/api/health', baseURL).toString())
  expect(res.ok()).toBeTruthy()
})

test('a visitor can create and delete a task', async ({ page }) => {
  const title = `E2E task ${Date.now()}`

  await page.goto('/')

  await page.fill('#task-title', title)
  await page.click('.task-form button[type="submit"]')

  const taskItem = page.locator('.task-item', { hasText: title })
  await expect(taskItem).toBeVisible()

  await taskItem.locator('[data-action="delete"]').click()
  await expect(taskItem).not.toBeVisible()
})

test('a visitor can mark a task as completed', async ({ page }) => {
  const title = `E2E complete ${Date.now()}`

  await page.goto('/')
  await page.fill('#task-title', title)
  await page.click('.task-form button[type="submit"]')

  const taskItem = page.locator('.task-item', { hasText: title })
  await taskItem.locator('[data-action="toggle"]').check()
  await expect(taskItem).toHaveClass(/is-completed/)

  // Clean up so repeated E2E runs don't pile up tasks in the shared preprod DB.
  await taskItem.locator('[data-action="delete"]').click()
})
