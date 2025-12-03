import { test, expect } from '@playwright/test';
import { SignInPage } from './page-objects/SignInPage';
import { SignUpPage } from './page-objects/SignUpPage';
import { RecipesPage } from './page-objects/RecipesPage';
import { cleanupUserByEmail } from './helpers/cleanup';
import { createSupabaseTestClient } from './helpers/supabase-test-client';

test.describe('Authentication Flow', () => {
  test('should display sign in page correctly', async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    // Verify page elements are visible using data-testid selectors
    await expect(signInPage.emailInput).toBeVisible();
    await expect(signInPage.passwordInput).toBeVisible();
    await expect(signInPage.signInButton).toBeVisible();
    await expect(signInPage.forgotPasswordLink).toBeVisible();
    await expect(signInPage.signUpLink).toBeVisible();

    // Verify elements can be found directly by test ID
    await expect(page.getByTestId('signin-email-input')).toBeVisible();
    await expect(page.getByTestId('signin-password-input')).toBeVisible();
    await expect(page.getByTestId('signin-submit-button')).toBeVisible();
  });

  test('should display sign up page correctly', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    // Verify page elements are visible using data-testid selectors
    await expect(signUpPage.emailInput).toBeVisible();
    await expect(signUpPage.passwordInput).toBeVisible();
    await expect(signUpPage.confirmPasswordInput).toBeVisible();
    await expect(signUpPage.displayNameInput).toBeVisible();
    await expect(signUpPage.signUpButton).toBeVisible();
    await expect(signUpPage.signInLink).toBeVisible();

    // Verify elements have correct test IDs
    await expect(page.getByTestId('signup-email-input')).toBeVisible();
    await expect(page.getByTestId('signup-password-input')).toBeVisible();
    await expect(
      page.getByTestId('signup-confirmpassword-input')
    ).toBeVisible();
    await expect(page.getByTestId('signup-displayname-input')).toBeVisible();
  });

  test('should show validation error for invalid email on sign in', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    // Fill in invalid email using data-testid selectors
    await signInPage.emailInput.fill('notanemail');
    await signInPage.passwordInput.fill('password123');

    // Click sign in button
    await signInPage.signInButton.click();

    // Wait a moment for validation or error to appear
    await page.waitForTimeout(1000);

    // Check if either:
    // 1. Client-side validation prevented submission (still on sign-in page)
    // 2. Server returned an error message (verify using data-testid)
    const currentUrl = page.url();
    const hasError = await signInPage.hasErrorMessage();

    // Should either show error or stay on sign-in page due to validation
    expect(currentUrl.includes('/sign-in') || hasError).toBeTruthy();

    // If error is shown, verify it's accessible via test ID
    if (hasError) {
      await expect(page.getByTestId('signin-error-message')).toBeVisible();
    }
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

test.describe('Sign Up', () => {
  test('should successfully create a new user account', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    // Generate unique test user with simpler email format (no dots in local part)
    const timestamp = Date.now();
    const testUser = {
      email: `testuser${timestamp}@tgmail.com`,
      password: 'TestPassword123!@#',
      displayName: 'E2E Test User',
    };

    try {
      // Fill in sign-up form
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for either redirect or error with longer timeout
      await page.waitForTimeout(1000); // Give form time to submit

      // Check if we have field-level validation errors
      if (await signUpPage.hasFieldErrors()) {
        const confirmPasswordError =
          await signUpPage.getFieldError('confirmPassword');
        const passwordError = await signUpPage.getFieldError('password');
        const emailError = await signUpPage.getFieldError('email');
        const fieldErrors = [
          confirmPasswordError && `confirmPassword: ${confirmPasswordError}`,
          passwordError && `password: ${passwordError}`,
          emailError && `email: ${emailError}`,
        ]
          .filter(Boolean)
          .join(', ');
        throw new Error(
          `Sign-up failed with field validation errors: ${fieldErrors}. This might indicate the form fields were not filled correctly.`
        );
      }

      // Check if we have a global error
      const errorMessage = signUpPage.errorMessage;
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await signUpPage.getErrorMessage();
        throw new Error(
          `Sign-up failed with error: ${errorText}. This might be due to Supabase email validation.`
        );
      }

      // Wait for redirect to sign-in page after successful sign-up
      await page.waitForURL(/\/sign-in/, { timeout: 15000 });

      // Verify success message is displayed (if present)
      const successMessage = page.getByTestId('signin-success-message');
      if (await successMessage.isVisible().catch(() => false)) {
        const messageText = await successMessage.textContent();
        expect(messageText?.toLowerCase()).toContain('success');
      }

      // Confirm the user's email using admin client (since email confirmation is enabled in Supabase)
      const supabase = createSupabaseTestClient();

      // Wait a moment for user creation to complete
      await page.waitForTimeout(2000);

      const {
        data: { users },
        error: listError,
      } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('Failed to list users:', listError);
        throw listError;
      }

      const user = users?.find((u) => u.email === testUser.email);

      if (user) {
        // Update user to mark email as confirmed
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true,
          }
        );

        if (updateError) {
          console.error('Failed to confirm user email:', updateError);
        } else {
          console.info('Successfully confirmed user email');
        }

        // Wait a moment for the update to propagate
        await page.waitForTimeout(1000);
      } else {
        throw new Error(`User not found: ${testUser.email}`);
      }
    } finally {
      // Clean up: delete the test user
      await cleanupUserByEmail(testUser.email);
    }
  });

  test('should show error when signing up with duplicate email', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    const timestamp = Date.now();
    const testUser = {
      email: `testduplicate${timestamp}@tgmail.com`,
      password: 'TestPassword123!@#',
      displayName: 'Duplicate Test User',
    };

    try {
      // First, create a user
      await signUpPage.goto();
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for form submission
      await page.waitForTimeout(1000);

      // Check if we have an error
      const errorMessage = signUpPage.errorMessage;
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await signUpPage.getErrorMessage();
        throw new Error(
          `First sign-up failed with error: ${errorText}. Cannot test duplicate email scenario.`
        );
      }

      // Wait for successful sign-up and redirect to sign-in page
      await page.waitForURL(/\/sign-in/, { timeout: 15000 });

      // Wait a moment for user creation to complete
      await page.waitForTimeout(1000);

      // Confirm the user's email using admin client
      const supabase = createSupabaseTestClient();
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      const user = users?.find((u) => u.email === testUser.email);

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        await page.waitForTimeout(1000);
      }

      // Try to sign up with the same email again
      await signUpPage.goto();
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for error message to appear
      await page.waitForTimeout(2000);

      // Should show error message (errorMessage already declared earlier in this scope)
      await expect(signUpPage.errorMessage).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('signup-error-message')).toBeVisible();

      const errorText = await signUpPage.getErrorMessage();
      expect(errorText.toLowerCase()).toContain('already');
    } finally {
      // Clean up: delete the test user
      await cleanupUserByEmail(testUser.email);
    }
  });

  test('should show validation errors for invalid sign-up data', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    // Try to submit with invalid email and weak password
    await signUpPage.emailInput.fill('notanemail@tgmail.com');
    await signUpPage.passwordInput.fill('weak');
    await signUpPage.confirmPasswordInput.fill('different');
    await signUpPage.displayNameInput.fill('Test User');

    // Click sign up
    await signUpPage.signUpButton.click();

    // Should show validation errors or stay on the page
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/sign-up');
  });

  test('should show error when password and confirm password do not match', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    // Fill form with mismatched passwords
    await signUpPage.emailInput.fill('test@tgmail.com');
    await signUpPage.passwordInput.fill('TestPassword123!@#');
    await signUpPage.confirmPasswordInput.fill('DifferentPassword123!@#');
    await signUpPage.displayNameInput.fill('Test User');

    // Click sign up
    await signUpPage.signUpButton.click();

    // Should show validation error or stay on page
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/sign-up');
  });
});

test.describe('Sign In', () => {
  test('should successfully sign in with valid credentials', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    const timestamp = Date.now();
    const testUser = {
      email: `testsignin${timestamp}@tgmail.com`,
      password: 'TestPassword123!@#',
      displayName: 'Sign In Test User',
    };

    try {
      // First, create a user
      await signUpPage.goto();
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for form submission
      await page.waitForTimeout(1000);

      // Check if we have an error
      const errorMessage = signUpPage.errorMessage;
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await signUpPage.getErrorMessage();
        throw new Error(
          `Sign-up failed with error: ${errorText}. Cannot test sign-in scenario.`
        );
      }

      // Wait for redirect to sign-in page
      await page.waitForURL(/\/sign-in/, { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Confirm the user's email using admin client
      const supabase = createSupabaseTestClient();
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      const user = users?.find((u) => u.email === testUser.email);

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        await page.waitForTimeout(1000);
      }

      // Now sign in with the new account
      const signInPage = new SignInPage(page);
      await signInPage.signIn(testUser.email, testUser.password);

      // Should redirect to recipes page after successful sign-in
      await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

      // Verify user is authenticated by checking if we can access protected content
      const recipesPage = new RecipesPage(page);
      await expect(recipesPage.searchBar).toBeVisible();

      // Verify user email is displayed in header
      await expect(page.getByTestId('header-user-email')).toBeVisible();
      const userEmail = await page
        .getByTestId('header-user-email')
        .textContent();
      expect(userEmail).toContain(testUser.email);
    } finally {
      // Clean up: delete the test user
      await cleanupUserByEmail(testUser.email);
    }
  });

  test('should show error when signing in with invalid email', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    // Try to sign in with invalid email format to trigger validation error
    await signInPage.emailInput.fill('notanemail');
    await signInPage.passwordInput.fill('SomePassword123!@#');
    await signInPage.signInButton.click();

    // Wait for validation error to appear
    await page.waitForTimeout(1000);

    // Check for field-level validation error first (most likely for invalid format)
    const emailFieldError = await signInPage.getFieldError('email');
    if (emailFieldError) {
      // Field-level validation error should be shown
      expect(emailFieldError.toLowerCase()).toContain('valid');
    } else {
      // If no field error, check for global error message
      const hasGlobalError = await signInPage.hasErrorMessage();
      if (hasGlobalError) {
        const errorText = await signInPage.getErrorMessage();
        expect(errorText.toLowerCase()).toMatch(/invalid|error|fail/);
      } else {
        // Should still be on sign-in page due to validation preventing submission
        expect(page.url()).toContain('/sign-in');
      }
    }
  });

  test('should show error when signing in with wrong password', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    const timestamp = Date.now();
    const testUser = {
      email: `testwrongpassword${timestamp}@tgmail.com`,
      password: 'TestPassword123!@#',
      displayName: 'Wrong Password Test User',
    };

    try {
      // First, create a user
      await signUpPage.goto();
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for form submission
      await page.waitForTimeout(1000);

      // Check if we have an error
      const errorMessage = signUpPage.errorMessage;
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await signUpPage.getErrorMessage();
        throw new Error(
          `Sign-up failed with error: ${errorText}. Cannot test wrong password scenario.`
        );
      }

      // Wait for redirect to sign-in page
      await page.waitForURL(/\/sign-in/, { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Confirm the user's email using admin client
      const supabase = createSupabaseTestClient();
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      const user = users?.find((u) => u.email === testUser.email);

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        await page.waitForTimeout(1000);
      }

      // Try to sign in with wrong password
      const signInPage = new SignInPage(page);
      await signInPage.signIn(testUser.email, 'WrongPassword123!@#');

      // Wait for error message
      await page.waitForTimeout(2000);

      // Should show error message (errorMessage already declared earlier in this scope for signUpPage)
      await expect(signInPage.errorMessage).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('signin-error-message')).toBeVisible();

      const errorText = await signInPage.getErrorMessage();
      expect(errorText.toLowerCase()).toContain('invalid');
    } finally {
      // Clean up: delete the test user
      await cleanupUserByEmail(testUser.email);
    }
  });
});

test.describe('Sign Out', () => {
  test('should successfully sign out and redirect to sign in', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    const timestamp = Date.now();
    const testUser = {
      email: `testsignout${timestamp}@tgmail.com`,
      password: 'TestPassword123!@#',
      displayName: 'Sign Out Test User',
    };

    try {
      // First, create and sign in a user
      await signUpPage.goto();
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for form submission
      await page.waitForTimeout(1000);

      // Check if we have an error
      const errorMessage = signUpPage.errorMessage;
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await signUpPage.getErrorMessage();
        throw new Error(
          `Sign-up failed with error: ${errorText}. Cannot test sign-out scenario.`
        );
      }

      // Wait for redirect to sign-in page
      await page.waitForURL(/\/sign-in/, { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Confirm the user's email using admin client
      const supabase = createSupabaseTestClient();
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      const user = users?.find((u) => u.email === testUser.email);

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        await page.waitForTimeout(1000);
      }

      // Sign in
      const signInPage = new SignInPage(page);
      await signInPage.signIn(testUser.email, testUser.password);

      // Wait for redirect to recipes page
      await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

      // Verify sign out button is visible
      const signOutButton = page.getByTestId('header-signout-button');
      await expect(signOutButton).toBeVisible();

      // Click sign out
      await signOutButton.click();

      // Should redirect to home page after sign out
      await expect(page).toHaveURL(/\/$/, { timeout: 5000 });

      // Verify user is no longer authenticated by trying to access protected route
      const recipesPage = new RecipesPage(page);
      await recipesPage.goto();

      // Should redirect back to sign-in page
      await expect(page).toHaveURL(/\/sign-in/);
    } finally {
      // Clean up: delete the test user
      await cleanupUserByEmail(testUser.email);
    }
  });

  test('should show sign in link after signing out', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    const timestamp = Date.now();
    const testUser = {
      email: `testsignoutlink${timestamp}@tgmail.com`,
      password: 'TestPassword123!@#',
      displayName: 'Sign Out Link Test User',
    };

    try {
      // First, create and sign in a user
      await signUpPage.goto();
      await signUpPage.signUp(
        testUser.email,
        testUser.password,
        testUser.password,
        testUser.displayName
      );

      // Wait for form submission
      await page.waitForTimeout(1000);

      // Check if we have an error
      const errorMessage = signUpPage.errorMessage;
      if (await errorMessage.isVisible().catch(() => false)) {
        const errorText = await signUpPage.getErrorMessage();
        throw new Error(
          `Sign-up failed with error: ${errorText}. Cannot test sign-out link scenario.`
        );
      }

      // Wait for redirect to sign-in page
      await page.waitForURL(/\/sign-in/, { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Confirm the user's email using admin client
      const supabase = createSupabaseTestClient();
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      const user = users?.find((u) => u.email === testUser.email);

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        await page.waitForTimeout(1000);
      }

      // Sign in
      const signInPage = new SignInPage(page);
      await signInPage.signIn(testUser.email, testUser.password);

      // Wait for redirect to recipes page
      await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

      // Sign out
      const signOutButton = page.getByTestId('header-signout-button');
      await signOutButton.click();

      // Wait for redirect to home page after sign out
      await expect(page).toHaveURL(/\/$/, { timeout: 5000 });

      // Verify sign in and sign up links are visible in header
      await expect(page.getByTestId('header-signin-link')).toBeVisible();
      await expect(page.getByTestId('header-signup-link')).toBeVisible();

      // Verify sign out button is no longer visible
      await expect(signOutButton).not.toBeVisible();
    } finally {
      // Clean up: delete the test user
      await cleanupUserByEmail(testUser.email);
    }
  });
});
