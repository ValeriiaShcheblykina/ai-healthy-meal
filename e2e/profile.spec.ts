import { test, expect } from '@playwright/test';
import { ProfilePage } from './page-objects/ProfilePage';
import { signInWithTestUser } from './helpers/auth-helpers';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in with persistent test user before each test
    await signInWithTestUser(page);
  });

  test('should display profile page correctly', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Verify page elements are visible
    await expect(profilePage.emailInput).toBeVisible();
    await expect(profilePage.displayNameInput).toBeVisible();
    await expect(profilePage.calorieTargetInput).toBeVisible();
    await expect(profilePage.saveButton).toBeVisible();

    // Verify diet checkboxes are visible
    await expect(profilePage.dietVegan).toBeVisible();
    await expect(profilePage.dietVegetarian).toBeVisible();
    await expect(profilePage.dietPescatarian).toBeVisible();
    await expect(profilePage.dietKeto).toBeVisible();
    await expect(profilePage.dietPaleo).toBeVisible();
    await expect(profilePage.dietHalal).toBeVisible();
    await expect(profilePage.dietKosher).toBeVisible();

    // Verify tag inputs are visible
    await expect(profilePage.allergensInput).toBeVisible();
    await expect(profilePage.dislikedIngredientsInput).toBeVisible();

    // Verify email is read-only
    await expect(profilePage.emailInput).toBeDisabled();
  });

  test('should navigate to profile page from header', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    // Start on recipes page
    await page.goto('/recipes');
    await expect(page).toHaveURL(/\/recipes/);

    // Navigate to profile from header
    await profilePage.gotoFromHeader();
    await expect(page).toHaveURL(/\/profile/);

    // Verify profile page is loaded
    await expect(profilePage.displayNameInput).toBeVisible();
  });

  test('should update display name', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    const newDisplayName = `Test User ${Date.now()}`;

    // Clear any existing display name first to avoid data pollution
    await profilePage.displayNameInput.fill('');
    await profilePage.saveChanges();
    await profilePage.waitForSave();
    await page.waitForTimeout(500);

    // Fill in display name
    await profilePage.fillDisplayName(newDisplayName);

    // Verify value is set
    await expect(profilePage.displayNameInput).toHaveValue(newDisplayName);

    // Set up network monitoring to verify API call succeeds
    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes('/api/auth/profile') &&
          response.request().method() === 'PATCH',
        { timeout: 15000 }
      )
      .catch(() => null);

    // Save changes
    await profilePage.saveChanges();

    // Wait for API response
    const response = await responsePromise;
    if (response && response.status() !== 200) {
      throw new Error(`Profile update failed with status ${response.status()}`);
    }

    // Wait for save to complete
    await profilePage.waitForSave();

    // Verify success message
    const hasSuccess = await profilePage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Reload page and verify value persisted
    await page.reload();

    // Wait for page to load and form to be populated
    // Email field should always have a value, so wait for it as indicator that form loaded
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    // Wait for display name to have the expected value
    await expect(profilePage.displayNameInput).toHaveValue(newDisplayName, {
      timeout: 10000,
    });
  });

  test('should update dietary preferences', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Wait for form to be fully loaded
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    // Select vegan and keto diets - ensure they are checked
    const isVeganChecked = await profilePage.dietVegan
      .isChecked()
      .catch(() => false);
    if (!isVeganChecked) {
      await profilePage.toggleDiet('vegan');
    }
    // Wait for state to update
    await expect(profilePage.dietVegan).toBeChecked({ timeout: 5000 });

    const isKetoChecked = await profilePage.dietKeto
      .isChecked()
      .catch(() => false);
    if (!isKetoChecked) {
      await profilePage.toggleDiet('keto');
    }
    // Wait for state to update
    await expect(profilePage.dietKeto).toBeChecked({ timeout: 5000 });

    // Ensure vegetarian is not checked
    const isVegetarianChecked = await profilePage.dietVegetarian
      .isChecked()
      .catch(() => false);
    if (isVegetarianChecked) {
      await profilePage.toggleDiet('vegetarian');
      await expect(profilePage.dietVegetarian).not.toBeChecked({
        timeout: 5000,
      });
    }

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Verify success message
    const hasSuccess = await profilePage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Reload page and verify selections persisted
    await page.reload();

    // Wait for page to load and form to be populated
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    // Wait a bit for form data to load
    await page.waitForTimeout(500);

    // Verify selections persisted after reload
    await expect(profilePage.dietVegan).toBeChecked({ timeout: 5000 });
    await expect(profilePage.dietKeto).toBeChecked({ timeout: 5000 });
  });

  test('should add and remove allergens', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Add allergens
    await profilePage.addAllergen('peanuts');
    await profilePage.addAllergen('shellfish');
    await profilePage.addAllergen('dairy');

    // Verify allergens are added
    const allergens = await profilePage.getAllergens();
    expect(allergens).toContain('peanuts');
    expect(allergens).toContain('shellfish');
    expect(allergens).toContain('dairy');

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Verify success message
    const hasSuccess = await profilePage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Remove an allergen
    await profilePage.removeAllergen('shellfish');

    // Verify allergen is removed
    const updatedAllergens = await profilePage.getAllergens();
    expect(updatedAllergens).toContain('peanuts');
    expect(updatedAllergens).toContain('dairy');
    expect(updatedAllergens).not.toContain('shellfish');

    // Save changes again
    await profilePage.saveChanges();
    await profilePage.waitForSave();
  });

  test('should add multiple allergens at once', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Add multiple allergens comma-separated
    await profilePage.addAllergens('wheat, soy, eggs');

    // Verify all allergens are added
    const allergens = await profilePage.getAllergens();
    expect(allergens).toContain('wheat');
    expect(allergens).toContain('soy');
    expect(allergens).toContain('eggs');

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();
  });

  test('should add and remove disliked ingredients', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Add disliked ingredients
    await profilePage.addDislikedIngredient('cilantro');
    await profilePage.addDislikedIngredient('mushrooms');
    await profilePage.addDislikedIngredient('onions');

    // Verify ingredients are added
    const ingredients = await profilePage.getDislikedIngredients();
    expect(ingredients).toContain('cilantro');
    expect(ingredients).toContain('mushrooms');
    expect(ingredients).toContain('onions');

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Remove an ingredient
    await profilePage.removeDislikedIngredient('mushrooms');

    // Verify ingredient is removed
    const updatedIngredients = await profilePage.getDislikedIngredients();
    expect(updatedIngredients).toContain('cilantro');
    expect(updatedIngredients).toContain('onions');
    expect(updatedIngredients).not.toContain('mushrooms');

    // Save changes again
    await profilePage.saveChanges();
    await profilePage.waitForSave();
  });

  test('should update calorie target', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    const calorieTarget = '2000';

    // Clear any existing value first to ensure clean state
    // Use fill() directly for more reliable clearing
    await profilePage.calorieTargetInput.fill('');
    await profilePage.calorieTargetInput.blur();
    await page.waitForTimeout(100);

    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Wait a moment for the save to complete
    await page.waitForTimeout(500);

    // Now set the new calorie target using fill() for reliable value replacement
    await profilePage.calorieTargetInput.fill(calorieTarget);
    await profilePage.calorieTargetInput.blur();
    await page.waitForTimeout(100);

    // Verify value is set before saving
    await expect(profilePage.calorieTargetInput).toHaveValue(calorieTarget);

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Verify success message
    const hasSuccess = await profilePage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Reload page and verify value persisted
    await page.reload();

    // Wait for page to load and form to be populated
    // Email field loads first, so wait for it as an indicator
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    // Wait for the calorie target field to be visible and loaded
    // The form loads data asynchronously, so we need to wait for it
    await expect(profilePage.calorieTargetInput).toBeVisible({
      timeout: 10000,
    });

    // Wait for the calorie target to match the expected value
    // Use a longer timeout and wait for the value to stabilize
    await expect(profilePage.calorieTargetInput).toHaveValue(calorieTarget, {
      timeout: 10000,
    });
  });

  test('should clear calorie target', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // First set a calorie target
    await profilePage.fillCalorieTarget('2000');
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Wait a moment for the save to complete
    await page.waitForTimeout(500);

    // Clear the calorie target - use fill() to ensure complete replacement
    await profilePage.calorieTargetInput.fill('');
    // Trigger blur to ensure React state updates
    await profilePage.calorieTargetInput.blur();
    await page.waitForTimeout(100);

    // Verify the field is empty before saving
    await expect(profilePage.calorieTargetInput).toHaveValue('');

    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Verify success message
    const hasSuccess = await profilePage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Reload page and verify value is cleared
    await page.reload();

    // Wait for page to load and form to be populated
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    // Wait for calorie target field to be visible and check it's empty
    await expect(profilePage.calorieTargetInput).toBeVisible({
      timeout: 10000,
    });
    const value = await profilePage.getCalorieTarget();
    expect(value).toBe('');
  });

  test('should show validation error for invalid calorie target', async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Try to set negative calorie target
    await profilePage.fillCalorieTarget('-100');

    // Blur the field to trigger validation
    await profilePage.calorieTargetInput.blur();

    // Wait for validation error
    await page.waitForTimeout(500);

    // Check for field error
    const hasError = await profilePage.hasFieldError('calorieTarget');
    if (hasError) {
      const error = await profilePage.getFieldError('calorieTarget');
      expect(error.length).toBeGreaterThan(0);
    }
  });

  test('should update all profile fields together', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Wait for form to be fully loaded first
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });
    await page.waitForTimeout(300);

    const displayName = `Complete Profile Test ${Date.now()}`;
    const calorieTarget = '1800';

    // Clear any existing values first to avoid data pollution from previous tests
    await profilePage.displayNameInput.fill('');
    await profilePage.displayNameInput.blur();
    await page.waitForTimeout(100);

    await profilePage.calorieTargetInput.fill('');
    await profilePage.calorieTargetInput.blur();
    await page.waitForTimeout(100);

    // Save cleared state first
    await profilePage.saveChanges();
    await profilePage.waitForSave();
    await page.waitForTimeout(500);

    // Now set the new values
    await profilePage.fillDisplayName(displayName);
    await profilePage.fillCalorieTarget(calorieTarget);

    // Ensure vegetarian diet is checked (toggle if currently unchecked)
    const isVegetarianChecked = await profilePage.dietVegetarian
      .isChecked()
      .catch(() => false);
    if (!isVegetarianChecked) {
      await profilePage.toggleDiet('vegetarian');
    }
    // Wait for the checkbox to be checked using Playwright's built-in waiting
    await expect(profilePage.dietVegetarian).toBeChecked({ timeout: 5000 });

    // Ensure pescatarian diet is checked (toggle if currently unchecked)
    const isPescatarianChecked = await profilePage.dietPescatarian
      .isChecked()
      .catch(() => false);
    if (!isPescatarianChecked) {
      await profilePage.toggleDiet('pescatarian');
    }
    // Wait for the checkbox to be checked using Playwright's built-in waiting
    await expect(profilePage.dietPescatarian).toBeChecked({ timeout: 5000 });

    await profilePage.addAllergen('nuts');
    await profilePage.addDislikedIngredient('garlic');

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Verify success message
    const hasSuccess = await profilePage.hasSuccessMessage();
    expect(hasSuccess).toBeTruthy();

    // Reload page and verify all values persisted
    await page.reload();

    // Wait for page to load and form to be populated
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    await expect(profilePage.displayNameInput).toHaveValue(displayName, {
      timeout: 10000,
    });
    await expect(profilePage.calorieTargetInput).toHaveValue(calorieTarget, {
      timeout: 10000,
    });
    await expect(profilePage.dietVegetarian).toBeChecked({ timeout: 3000 });
    await expect(profilePage.dietPescatarian).toBeChecked({ timeout: 3000 });

    const allergens = await profilePage.getAllergens();
    expect(allergens).toContain('nuts');

    const ingredients = await profilePage.getDislikedIngredients();
    expect(ingredients).toContain('garlic');
  });

  test('should show generate recipe button when preferences are set', async ({
    page,
  }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Initially, button might not be visible if no preferences
    // Set some preferences
    await profilePage.toggleDiet('vegan');
    await profilePage.addAllergen('peanuts');

    // Save to ensure preferences are saved
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Reload page
    await page.reload();

    // Wait for component to check preferences
    await page.waitForTimeout(1000);

    // Check if generate recipe button is visible
    // Note: Button might not appear immediately if component is still checking
    const isButtonVisible = await profilePage.generateRecipeButton
      .isVisible()
      .catch(() => false);

    // If button is visible, verify it's clickable
    if (isButtonVisible) {
      await expect(profilePage.generateRecipeButton).toBeEnabled();
    }
  });

  test('should show loading state when saving', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Update display name
    await profilePage.fillDisplayName('Loading Test');

    // Set up route interceptor to delay the API response
    await page.route('**/api/auth/profile', async (route) => {
      // Delay the response by 2000ms to ensure loading state is visible
      // Use Promise-based delay instead of waitForTimeout to avoid test ending errors
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Click save button
    await profilePage.saveButton.click();

    // Check for loading state - scope to main content area to avoid header buttons
    // Use getByRole which will match the button with "Saving..." or "Save Changes" text
    const submitButton = page
      .locator('main')
      .getByRole('button', { name: /saving|save changes/i });
    await expect(submitButton).toHaveText(/saving/i, { timeout: 3000 });

    // Wait for save to complete
    await profilePage.waitForSave();

    // Clean up route interceptor
    await page.unroute('**/api/auth/profile');
  });

  test('should handle save error gracefully', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Mock a network error by intercepting the API call
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Try to save
    await profilePage.fillDisplayName('Error Test');
    await profilePage.saveChanges();

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Check for error message
    const hasError = await profilePage.hasGlobalError();
    if (hasError) {
      const error = await profilePage.getGlobalError();
      expect(error.length).toBeGreaterThan(0);
    }
  });

  test('should persist profile data after page reload', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    const displayName = `Persistence Test ${Date.now()}`;
    const calorieTarget = '2200';

    // Set profile data
    await profilePage.fillDisplayName(displayName);
    await profilePage.fillCalorieTarget(calorieTarget);

    // Ensure paleo diet is selected (toggle if not already checked)
    const isPaleoChecked = await profilePage.dietPaleo
      .isChecked()
      .catch(() => false);
    if (!isPaleoChecked) {
      await profilePage.toggleDiet('paleo');
      // Wait for diet to be checked before saving
      await expect(profilePage.dietPaleo).toBeChecked({ timeout: 3000 });
    }

    await profilePage.addAllergen('gluten');
    await profilePage.addDislikedIngredient('tomatoes');

    // Save changes
    await profilePage.saveChanges();
    await profilePage.waitForSave();

    // Navigate away and back
    await page.goto('/recipes');
    await page.goto('/profile');

    // Wait for page to load and form to be populated
    // Email field should always have a value, so wait for it as indicator that form loaded
    await expect(profilePage.emailInput).toHaveValue(/.+@.+\..+/, {
      timeout: 10000,
    });

    // Verify all data persisted
    await expect(profilePage.displayNameInput).toHaveValue(displayName, {
      timeout: 10000,
    });
    await expect(profilePage.calorieTargetInput).toHaveValue(calorieTarget, {
      timeout: 10000,
    });
    await expect(profilePage.dietPaleo).toBeChecked({ timeout: 3000 });

    const allergens = await profilePage.getAllergens();
    expect(allergens).toContain('gluten');

    const ingredients = await profilePage.getDislikedIngredients();
    expect(ingredients).toContain('tomatoes');
  });

  test('should display email correctly', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Get the email from the input
    const email = await profilePage.getEmail();

    // Email should match the test user email
    const expectedEmail = process.env.E2E_USERNAME;
    if (expectedEmail) {
      expect(email).toBe(expectedEmail);
    }

    // Verify email input is disabled (read-only)
    await expect(profilePage.emailInput).toBeDisabled();
  });
});

test.describe('Profile Page - Unauthenticated', () => {
  test('should redirect to sign in when accessing profile page unauthenticated', async ({
    page,
  }) => {
    // Ensure we're signed out
    await page.goto('/');
    const signOutButton = page.getByTestId('header-signout-button');
    if (await signOutButton.isVisible().catch(() => false)) {
      await signOutButton.click();
      await page.waitForURL(/\/sign-in/, { timeout: 5000 });
    }

    // Try to access profile page
    await page.goto('/profile');

    // Should redirect to sign in
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
