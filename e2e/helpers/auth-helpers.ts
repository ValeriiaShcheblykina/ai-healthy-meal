/**
 * Authentication helpers for E2E tests
 * Provides reusable functions for user authentication
 */
import type { Page } from '@playwright/test';
import { SignUpPage } from '../page-objects/SignUpPage';
import { SignInPage } from '../page-objects/SignInPage';

/**
 * Sign in with persistent test user from .env.test
 * This is much faster than creating a new user for each test
 *
 * Required env vars:
 * - E2E_TEST_EMAIL
 * - E2E_TEST_PASSWORD
 */
export async function signInWithTestUser(page: Page) {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_USERNAME and E2E_PASSWORD must be set in .env.test\n\n' +
        'Add these lines to your .env.test file:\n' +
        'E2E_USERNAME=test.e2e@example.com\n' +
        'E2E_PASSWORD=TestPassword123!@#\n\n' +
        'Then create this user in Supabase Dashboard.'
    );
  }

  const signInPage = new SignInPage(page);
  await signInPage.goto();

  console.info(`Attempting sign-in with: ${email}`);
  console.info(`Attempting sign-in with: ${password}`);

  try {
    // Fill in credentials
    await signInPage.emailInput.fill(email);
    await signInPage.passwordInput.fill(password);

    // Click sign in button
    await signInPage.signInButton.click();

    // Wait for either success (redirect) or error message
    await Promise.race([
      page.waitForURL(/\/recipes/, { timeout: 15000 }),
      page
        .getByTestId('signin-error-message')
        .waitFor({ state: 'visible', timeout: 15000 }),
    ]);

    // Check if we successfully navigated
    if (!page.url().includes('/recipes')) {
      const errorMsg = page.getByTestId('signin-error-message');
      const errorText = await errorMsg.textContent();
      throw new Error(`Sign-in failed: ${errorText || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Sign-in failed');

    // Check for error messages
    const errorMsg = page.getByTestId('signin-error-message');
    if (await errorMsg.isVisible()) {
      const errorText = await errorMsg.textContent();
      console.error('Error message:', errorText);
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/signin-failed.png' });

    throw new Error(
      `Failed to sign in with user: ${email}\n` +
        `Current URL: ${page.url()}\n` +
        'Make sure:\n' +
        '1. The user exists in Supabase\n' +
        '2. The credentials are correct\n' +
        '3. Your app is running at http://localhost:3000\n' +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a new test user with unique email
 * Use this sparingly - prefer signInWithTestUser() for faster tests
 */
export async function createTestUser(page: Page) {
  const signUpPage = new SignUpPage(page);
  await signUpPage.goto();

  const timestamp = Date.now();
  const testUser = {
    email: `test.user${timestamp}@example.com`,
    password: 'TestPassword123!@#',
    displayName: 'E2E Test User',
  };

  await signUpPage.signUp(
    testUser.email,
    testUser.password,
    testUser.password,
    testUser.displayName
  );

  // Wait for redirect to sign-in page after successful sign-up
  await page.waitForURL(/\/sign-in\?success=true/, { timeout: 10000 });

  // Sign in with the new account
  const signInPage = new SignInPage(page);
  await signInPage.signIn(testUser.email, testUser.password);

  // Wait for redirect to recipes page
  await page.waitForURL(/\/recipes/, { timeout: 10000 });

  return testUser;
}

/**
 * Sign in with existing test user credentials
 */
export async function signInTestUser(
  page: Page,
  email: string,
  password: string
) {
  const signInPage = new SignInPage(page);
  await signInPage.goto();

  await signInPage.signIn(email, password);

  // Wait for redirect to recipes page
  await page.waitForURL(/\/recipes/, { timeout: 10000 });
}

/**
 * Sign out current user
 */
export async function signOutTestUser(page: Page) {
  const signOutButton = page.getByTestId('header-signout-button');

  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL(/\/sign-in/, { timeout: 5000 });
  }
}

/**
 * Create a test user and store credentials in context
 * Useful for reusing the same user across multiple tests
 */
export async function setupAuthenticatedUser(page: Page) {
  try {
    const user = await createTestUser(page);
    // Store in page context for potential reuse
    await page.evaluate((userData) => {
      sessionStorage.setItem('testUser', JSON.stringify(userData));
    }, user);
    return user;
  } catch (error) {
    console.error('Failed to create authenticated user:', error);
    throw error;
  }
}
