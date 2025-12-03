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
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!email || !password) {
    throw new Error(
      'E2E_USERNAME and E2E_PASSWORD must be set in .env.test\n\n' +
        'Add these lines to your .env.test file:\n' +
        'E2E_USERNAME=test.e2e@example.com\n' +
        'E2E_PASSWORD=TestPassword123!@#\n\n' +
        'Then create this user in Supabase Dashboard.'
    );
  }

  if (!supabaseUrl) {
    throw new Error(
      'SUPABASE_URL must be set in .env.test\n\n' +
        'Your .env.test should match the Supabase instance your dev server uses.\n' +
        'Check your .env file and copy the SUPABASE_URL to .env.test'
    );
  }

  console.info(`🔐 Signing in with: ${email}`);
  console.info(`🔗 Using Supabase URL: ${supabaseUrl}`);

  const signInPage = new SignInPage(page);
  await signInPage.goto();

  // Check if already signed in (from previous test or existing session)
  if (page.url().includes('/recipes')) {
    console.info('✅ Already signed in');
    return;
  }

  try {
    // Wait for page to be fully loaded and React to hydrate
    await page.waitForLoadState('networkidle');

    // Ensure form elements are ready
    await signInPage.emailInput.waitFor({ state: 'visible' });
    await signInPage.passwordInput.waitFor({ state: 'visible' });
    await signInPage.signInButton.waitFor({ state: 'visible' });

    // Fill in credentials
    await signInPage.emailInput.fill(email);
    await signInPage.passwordInput.fill(password);

    // Small delay to allow React state updates and validation
    await page.waitForTimeout(200);

    // Set up network monitoring to catch API errors
    let apiResponse: { status?: number; body?: unknown } | null = null;
    const responsePromise = page
      .waitForResponse(
        (response) => response.url().includes('/api/auth/sign-in'),
        { timeout: 15000 }
      )
      .catch(() => null);

    // Click sign in and wait for either navigation or response
    await signInPage.signInButton.click();

    // Wait for API response
    const response = await responsePromise;
    if (response) {
      apiResponse = {
        status: response.status(),
        body: await response.json().catch(() => null),
      };
      console.info(`📡 API Response: ${apiResponse.status}`);
    }

    // Wait for either navigation to recipes or error message to appear
    try {
      await Promise.race([
        page.waitForURL(/\/recipes/, { timeout: 10000 }),
        page.waitForSelector('[data-testid="signin-error-message"]', {
          state: 'visible',
          timeout: 10000,
        }),
        // Also wait for button to stop loading (isLoading becomes false)
        page.waitForFunction(
          () => {
            const button = document.querySelector(
              '[data-testid="signin-submit-button"]'
            );
            return button && !button.textContent?.includes('Signing in');
          },
          { timeout: 10000 }
        ),
      ]);
    } catch {
      // If none of the above happened, check current state
      console.warn('⚠️ Timeout waiting for navigation or error message');
    }

    // Check if we're on the recipes page (success)
    if (page.url().includes('/recipes')) {
      console.info('✅ Sign-in successful');
      return;
    }

    // Still on sign-in page - check for error message
    const errorMsg = page.getByTestId('signin-error-message');
    const isErrorVisible = await errorMsg.isVisible().catch(() => false);

    if (isErrorVisible) {
      const uiError = (await errorMsg.textContent()) || '';
      console.error('❌ UI Error:', uiError);

      // Include API response info if available
      let errorDetails = `Sign-in failed: ${uiError}`;
      if (apiResponse) {
        errorDetails += `\nAPI Status: ${apiResponse.status}`;
        if (apiResponse.body?.error) {
          errorDetails += `\nAPI Error: ${JSON.stringify(apiResponse.body.error)}`;
        }
      }

      throw new Error(errorDetails);
    }

    // No error message visible - check API response for clues
    let errorMessage = 'Sign-in failed: No error message displayed';
    if (apiResponse) {
      errorMessage += `\nAPI returned status ${apiResponse.status}`;
      if (apiResponse.body?.error) {
        errorMessage += `\nAPI error: ${JSON.stringify(apiResponse.body.error)}`;
      }
    }

    throw new Error(errorMessage);
  } catch (error) {
    console.error('❌ Sign-in failed');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/signin-failed.png' });

    // Check for UI error message
    const errorMsg = page.getByTestId('signin-error-message');
    let uiError = '';
    if (await errorMsg.isVisible().catch(() => false)) {
      uiError = (await errorMsg.textContent()) || '';
      console.error('UI Error:', uiError);
    }

    throw new Error(
      `Failed to sign in with user: ${email}\n` +
        `Current URL: ${page.url()}\n` +
        `Supabase URL: ${supabaseUrl}\n` +
        (uiError ? `UI Error: ${uiError}\n` : '') +
        '\nTroubleshooting:\n' +
        '1. Verify the user exists in Supabase Dashboard → Authentication\n' +
        '2. Check that SUPABASE_URL in .env.test matches your .env file\n' +
        '3. Ensure Supabase is running (npx supabase status)\n' +
        '4. Verify credentials are correct\n' +
        `\nOriginal error: ${error instanceof Error ? error.message : String(error)}`
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
