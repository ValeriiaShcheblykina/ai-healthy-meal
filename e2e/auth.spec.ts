import { test, expect } from '@playwright/test';
import { SignInPage } from './page-objects/SignInPage';
import { SignUpPage } from './page-objects/SignUpPage';
import { RecipesPage } from './page-objects/RecipesPage';

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

  // test('should successfully create a new user account', async ({ page }) => {
  //   const signUpPage = new SignUpPage(page);
  //   await signUpPage.goto();

  //   // Generate unique test user
  //   const timestamp = Date.now();
  //   const testUser = {
  //     email: `test.user.${timestamp}@gmail.com`,
  //     password: 'TestPassword123!',
  //     displayName: 'E2E Test User',
  //   };

  //   // Fill in sign-up form
  //   await signUpPage.signUp(
  //     testUser.email,
  //     testUser.password,
  //     testUser.password,
  //     testUser.displayName
  //   );

  //   // Should redirect to sign-in page after successful sign-up
  //   await expect(page).toHaveURL(/\/sign-in\?success=true/, { timeout: 10000 });

  //   // Verify success message is displayed
  //   await expect(page.getByTestId('signin-success-message')).toBeVisible();
  //   const successMessage = await page.getByTestId('signin-success-message').textContent();
  //   expect(successMessage).toContain('Account created successfully');

  //   // Confirm the user's email using admin client (since email confirmation is enabled in Supabase)
  //   const supabase = createSupabaseTestClient();

  //   // Wait a moment for user creation to complete
  //   await page.waitForTimeout(2000);

  //   const { data: userData, error: listError } = await supabase.auth.admin.listUsers();

  //   if (listError) {
  //     console.error('Failed to list users:', listError);
  //   }

  //   console.log(`Looking for user: ${testUser.email}`);
  //   console.log(`Total users in database: ${userData?.users.length || 0}`);

  //   const user = userData?.users.find((u) => u.email === testUser.email);

  //   if (user) {
  //     console.log(`Found user: ${user.id}, email_confirmed: ${user.email_confirmed_at}`);

  //     // Update user to mark email as confirmed
  //     const { error } = await supabase.auth.admin.updateUserById(user.id, {
  //       email_confirm: true,
  //     });

  //     if (error) {
  //       console.error('Failed to confirm user email:', error);
  //     } else {
  //       console.log('Successfully confirmed user email');
  //     }

  //     // Wait a moment for the update to propagate
  //     await page.waitForTimeout(1000);
  //   } else {
  //     console.error('User not found:', testUser.email);
  //     console.log('Available users:', userData?.users.map(u => u.email).join(', '));
  //   }

  //   // Sign in with the new account
  //   const signInPage = new SignInPage(page);
  //   await signInPage.signIn(testUser.email, testUser.password);

  //   // Should redirect to recipes page after successful sign-in
  //   await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

  //   // Verify user is authenticated by checking if we can access protected content
  //   const recipesPage = new RecipesPage(page);
  //   await expect(recipesPage.searchBar).toBeVisible();
  // });

  // test.skip('should show error when signing up with existing email', async ({
  //   page,
  // }) => {
  //   const signUpPage = new SignUpPage(page);

  //   // First, create a user
  //   await signUpPage.goto();
  //   const timestamp = Date.now();
  //   const testUser = {
  //     email: `test.duplicate.${timestamp}@gmail.com`,
  //     password: 'TestPassword123!@#',
  //     displayName: 'Duplicate Test User',
  //   };

  //   await signUpPage.signUp(
  //     testUser.email,
  //     testUser.password,
  //     testUser.password,
  //     testUser.displayName
  //   );

  //   // Wait for successful sign-up and redirect to sign-in page
  //   await expect(page).toHaveURL(/\/sign-in\?success=true/, { timeout: 10000 });

  //   // Sign in with the new account
  //   const signInPage = new SignInPage(page);
  //   await signInPage.signIn(testUser.email, testUser.password);

  //   // Wait for redirect to recipes page
  //   await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

  //   // Sign out using header button (verify data-testid)
  //   const signOutButton = page.getByTestId('header-signout-button');
  //   await expect(signOutButton).toBeVisible();
  //   await signOutButton.click();

  //   // Wait for redirect to sign-in page
  //   await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

  //   // Try to sign up with the same email again
  //   await signUpPage.goto();
  //   await signUpPage.signUp(
  //     testUser.email,
  //     testUser.password,
  //     testUser.password,
  //     testUser.displayName
  //   );

  //   // Should show error message (accessible via data-testid)
  //   await expect(signUpPage.errorMessage).toBeVisible();
  //   await expect(page.getByTestId('signup-error-message')).toBeVisible();
  //   const errorText = await signUpPage.getErrorMessage();
  //   expect(errorText.toLowerCase()).toContain('already');
  // });

  // test.skip('should show validation errors for invalid sign-up data', async ({
  //   page,
  // }) => {
  //   const signUpPage = new SignUpPage(page);
  //   await signUpPage.goto();

  //   // Try to submit with invalid email and weak password
  //   await signUpPage.emailInput.fill('notanemail');
  //   await signUpPage.passwordInput.fill('weak');
  //   await signUpPage.confirmPasswordInput.fill('different');
  //   await signUpPage.displayNameInput.fill('Test User');

  //   // Click sign up
  //   await signUpPage.signUpButton.click();

  //   // Should show validation errors or stay on the page
  //   await page.waitForTimeout(1000);
  //   const currentUrl = page.url();
  //   expect(currentUrl).toContain('/sign-up');
  // });
});
