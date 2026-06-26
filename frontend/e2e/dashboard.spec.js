import { test, expect } from '@playwright/test';

/**
 * E2E tests for the core generation flow.
 * Requires: running dev server + running backend + seeded database.
 */

// Re-usable login helper
async function loginAs(page, email = 'john@example.com', password = 'Demo1234!') {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/', { timeout: 8000 });
}

test.describe('Dashboard — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('shows the generator form', async ({ page }) => {
    await expect(page.getByPlaceholder(/what topic to write about/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
  });

  test('shows credits balance in header', async ({ page }) => {
    await expect(page.getByText(/credits/i).first()).toBeVisible();
  });

  test('can switch to Linking Assistant tab', async ({ page }) => {
    await page.getByRole('button', { name: /linking assistant/i }).click();
    await expect(page.getByText(/internal link/i)).toBeVisible();
  });

  test('generate button disabled when input is empty', async ({ page }) => {
    const btn = page.locator('button[type="submit"]').first();
    await expect(btn).toBeDisabled();
  });

  test('generate button enables when keyword is typed', async ({ page }) => {
    await page.getByPlaceholder(/what topic to write about/i).fill('best SEO tools 2025');
    const btn = page.locator('button[type="submit"]').first();
    await expect(btn).toBeEnabled();
  });
});

test.describe('History page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/history');
  });

  test('shows the content library heading', async ({ page }) => {
    await expect(page.getByText(/content library|content/i).first()).toBeVisible();
  });

  test('shows search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search by keyword or title/i)).toBeVisible();
  });

  test('shows existing articles from seed data', async ({ page }) => {
    await expect(page.locator('[class*="Card"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Settings page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/settings');
  });

  test('shows the settings page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('shows profile section with name and email', async ({ page }) => {
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });
});

test.describe('Navigation — sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('navigates to /history via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /history/i }).first().click();
    await expect(page).toHaveURL('/history');
  });

  test('navigates to /settings via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).first().click();
    await expect(page).toHaveURL('/settings');
  });

  test('navigates to /buy-credits via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /buy credits|credits/i }).first().click();
    await expect(page).toHaveURL('/buy-credits');
  });

  test('logout clears session and redirects to /welcome', async ({ page }) => {
    await page.getByRole('button', { name: /sign out|logout/i }).click();
    await expect(page).toHaveURL(/\/welcome/);
  });
});
