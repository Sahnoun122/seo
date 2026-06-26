import { test, expect } from '@playwright/test';

/**
 * E2E tests for the authentication flow.
 * These tests require a running dev server and a seeded database.
 * Run: npm run e2e
 */

test.describe('Landing page', () => {
  test('shows the landing page at /welcome', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page).toHaveTitle(/SEO Gen AI/i);
    await expect(page.getByText(/Generate SEO content/i).first()).toBeVisible();
  });

  test('unauthenticated users redirected to /welcome from /', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('navigates to /register from landing CTA', async ({ page }) => {
    await page.goto('/welcome');
    const ctaButton = page.getByRole('link', { name: /start.*free|get started|create account/i }).first();
    await ctaButton.click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Register page', () => {
  test('renders the registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('shows password strength meter when typing', async ({ page }) => {
    await page.goto('/register');
    const passwordInput = page.getByLabel(/^password$/i);
    await passwordInput.fill('weak');
    await expect(page.getByText(/weak|fair|good|strong|excellent/i)).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    await page.goto('/register');
    const passwordInput = page.getByLabel(/^password$/i);
    await passwordInput.fill('TestPass123');
    expect(await passwordInput.getAttribute('type')).toBe('password');

    await page.getByRole('button', { name: /show password/i }).click();
    expect(await passwordInput.getAttribute('type')).toBe('text');
  });

  test('shows validation error for duplicate email', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('admin@seo.com'); // seeded admin email
    await page.getByLabel(/^password$/i).fill('TestPass123!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/already exists|already registered/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Login page', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('nobody@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials|invalid email/i)).toBeVisible({ timeout: 5000 });
  });

  test('redirects to dashboard on successful login with seeded user', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('john@example.com');
    await page.getByLabel(/password/i).fill('Demo1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/', { timeout: 8000 });
    await expect(page.getByText(/generate seo content/i)).toBeVisible();
  });
});

test.describe('Password Reset flow', () => {
  test('renders forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('shows confirmation after submitting email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email address/i).fill('john@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/check your inbox|check your email/i)).toBeVisible({ timeout: 8000 });
  });
});
