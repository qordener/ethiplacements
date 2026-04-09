import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should redirect / to /dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display the AppShell header', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('header')).toBeVisible();
  });

  test('should display dashboard content (loaded or empty state)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loaded = page.locator('[data-testid="dashboard-loaded"]');
    const empty = page.locator('[data-testid="dashboard-empty"]');
    const error = page.locator('[data-testid="dashboard-error"]');

    const visible = await Promise.any([
      loaded.waitFor({ timeout: 5000 }).then(() => 'loaded'),
      empty.waitFor({ timeout: 5000 }).then(() => 'empty'),
      error.waitFor({ timeout: 5000 }).then(() => 'error'),
    ]);

    expect(['loaded', 'empty', 'error']).toContain(visible);
  });

  test('should navigate to /portfolio/new from empty state CTA', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const cta = page.locator('[data-testid="cta-create-portfolio"]');
    if (await cta.isVisible()) {
      await cta.click();
      await expect(page).toHaveURL(/\/portfolio\/new/);
    } else {
      test.skip();
    }
  });
});

test.describe('New Portfolio', () => {
  test('should display the creation form', async ({ page }) => {
    await page.goto('/portfolio/new');
    await expect(page.locator('[data-testid="input-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-submit"]')).toBeVisible();
  });

  test('submit button should be disabled when name is empty', async ({ page }) => {
    await page.goto('/portfolio/new');
    await expect(page.locator('[data-testid="btn-submit"]')).toBeDisabled();
  });

  test('should enable submit when name is filled', async ({ page }) => {
    await page.goto('/portfolio/new');
    await page.fill('[data-testid="input-name"]', 'Mon PEA');
    await expect(page.locator('[data-testid="btn-submit"]')).toBeEnabled();
  });
});
