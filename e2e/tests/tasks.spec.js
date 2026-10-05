import { test, expect } from '@playwright/test'

const PASSWORD = 'e2e-password-123'

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`
}

async function signUp(page, email) {
  const dialog = page.locator('#auth-dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('[data-mode="register"]').click()
  await dialog.locator('#auth-email').fill(email)
  await dialog.locator('#auth-password').fill(PASSWORD)
  await dialog.locator('.auth-submit').click()
  await expect(dialog).not.toBeVisible()
}

test('health check responds', async ({ request, baseURL }) => {
  const res = await request.get(new URL('/api/health', baseURL).toString())
  expect(res.ok()).toBeTruthy()
})

test('the task API requires authentication', async ({ request, baseURL }) => {
  const res = await request.get(new URL('/api/tasks', baseURL).toString())
  expect(res.status()).toBe(401)
})

test('a visitor sees the page, and is asked to log in when adding a task', async ({ page }) => {
  const title = `E2E task ${Date.now()}`

  await page.goto('/')
  await expect(page.locator('.task-form')).toBeVisible()
  await expect(page.locator('.guest-state')).toBeVisible()

  await page.fill('#task-title', title)
  await page.click('.task-form button[type="submit"]')

  // Signing up from the prompt creates the task that was typed before.
  await signUp(page, uniqueEmail('visitor'))

  const taskItem = page.locator('.task-item', { hasText: title })
  await expect(taskItem).toBeVisible()

  await taskItem.locator('[data-action="delete"]').click()
  await expect(taskItem).not.toBeVisible()
})

test('a user can mark a task as completed, and tasks stay private', async ({ page, browser }) => {
  const title = `E2E complete ${Date.now()}`

  await page.goto('/')
  await page.click('.guest-state [data-action="register"]')
  await signUp(page, uniqueEmail('owner'))

  await page.fill('#task-title', title)
  await page.click('.task-form button[type="submit"]')

  const taskItem = page.locator('.task-item', { hasText: title })
  await taskItem.locator('[data-action="toggle"]').check()
  await expect(taskItem).toHaveClass(/is-completed/)

  // A different user, in a separate browser context, doesn't see it.
  const otherContext = await browser.newContext()
  const otherPage = await otherContext.newPage()
  await otherPage.goto('/')
  await otherPage.click('.guest-state [data-action="register"]')
  await signUp(otherPage, uniqueEmail('other'))
  await expect(otherPage.locator('.task-list, .empty-state').first()).toBeVisible()
  await expect(otherPage.locator('.task-item', { hasText: title })).toHaveCount(0)
  await otherContext.close()

  // Clean up so repeated E2E runs don't pile up tasks in the shared preprod DB.
  await taskItem.locator('[data-action="delete"]').click()
})

test('logging out hides the tasks again', async ({ page }) => {
  await page.goto('/')
  await page.click('.user-menu [data-action="login"]')
  await signUp(page, uniqueEmail('logout'))

  await expect(page.locator('[data-action="logout"]')).toBeVisible()
  await page.click('[data-action="logout"]')
  await expect(page.locator('.guest-state')).toBeVisible()
})
