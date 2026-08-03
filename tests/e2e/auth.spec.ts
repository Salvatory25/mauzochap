import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation Flow', () => {
  test('should load landing page and navigate to auth page', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Verify title and page header content
    await expect(page).toHaveTitle(/MauzoChap/);
    await expect(page.locator('header')).toContainText('MauzoChap');

    // Wait for hydration
    await page.waitForTimeout(1000);

    // Click Sign In link
    const signInLink = page.locator('header a:has-text("Sign in")');
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    // Verify redirect to /auth
    await expect(page).toHaveURL(/\/auth/);

    // Wait for auth page hydration
    await page.waitForTimeout(1000);

    // Verify authentication form elements (Sign in page)
    await expect(page.locator('h1')).toHaveText(/Sign in|Ingia/);
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Toggle to Sign Up page
    const toggleSignUp = page.locator('p:has-text("No account?") button');
    await expect(toggleSignUp).toBeVisible();
    await toggleSignUp.click();

    // Verify sign up specific elements appear
    await expect(page.locator('#full')).toBeVisible();
    await expect(page.locator('#biz')).toBeVisible();
    await expect(page.locator('h1')).toHaveText(/Sign up|Jisajili/);
  });
});
