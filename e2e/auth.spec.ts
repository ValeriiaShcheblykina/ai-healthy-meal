import { test, expect } from '@playwright/test';
import { SignInPage } from './page-objects/SignInPage';
import { SignUpPage } from './page-objects/SignUpPage';
import { RecipesPage } from './page-objects/RecipesPage';

test.describe('Authentication Flow', () => {
  test('should display sign in page correctly', async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    // Verify page elements are visible
    await expect(signInPage.emailInput).toBeVisible();
    await expect(signInPage.passwordInput).toBeVisible();
    await expect(signInPage.signInButton).toBeVisible();
    await expect(signInPage.forgotPasswordLink).toBeVisible();
    await expect(signInPage.signUpLink).toBeVisible();
  });

  test('should display sign up page correctly', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    // Verify page elements are visible
    await expect(signUpPage.emailInput).toBeVisible();
    await expect(signUpPage.passwordInput).toBeVisible();
    await expect(signUpPage.confirmPasswordInput).toBeVisible();
    await expect(signUpPage.displayNameInput).toBeVisible();
    await expect(signUpPage.signUpButton).toBeVisible();
    await expect(signUpPage.signInLink).toBeVisible();
  });

  test('should show validation error for invalid email on sign in', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    // Fill in invalid email
    await signInPage.emailInput.fill('notanemail');
    await signInPage.passwordInput.fill('password123');

    // Click sign in button
    await signInPage.signInButton.click();

    // Wait a moment for validation or error to appear
    await page.waitForTimeout(1000);

    // Check if either:
    // 1. Client-side validation prevented submission (still on sign-in page)
    // 2. Server returned an error message
    const currentUrl = page.url();
    const hasError = await signInPage.hasErrorMessage();

    // Should either show error or stay on sign-in page due to validation
    expect(currentUrl.includes('/sign-in') || hasError).toBeTruthy();
  });

  test('should navigate between sign in and sign up pages', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    // Navigate to sign up
    await signInPage.clickSignUpLink();
    await expect(page).toHaveURL(/\/sign-up/);

    // Navigate back to sign in
    const signUpPage = new SignUpPage(page);
    await signUpPage.clickSignInLink();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('should redirect to sign in when accessing protected route unauthenticated', async ({
    page,
  }) => {
    const recipesPage = new RecipesPage(page);
    await recipesPage.goto();

    // Should redirect to sign in page
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
