import { test, expect } from '@playwright/test';
import { RecipesPage } from './page-objects/RecipesPage';
import { signInWithTestUser } from './helpers/auth-helpers';

test.describe('Recipes Page', () => {
  // Setup: Sign in with persistent test user before each test
  // This is much faster than creating a new user each time
  test.beforeEach(async ({ page }) => {
    try {
      console.log('Signing in with persistent test user...');
      await signInWithTestUser(page);
      console.log('✓ Signed in successfully');
    } catch (error) {
      console.error('Failed to sign in:', error);
      console.log('Current URL:', page.url());
      
      // Check if there's an error message on the page
      const errorMsg = page.getByTestId('signin-error-message');
      if (await errorMsg.isVisible()) {
        const errorText = await errorMsg.textContent();
        console.error('Sign-in error:', errorText);
      }
      
      throw error;
    }
  });

  test('should display recipes page with all interactive elements', async ({
    page,
  }) => {
    const recipesPage = new RecipesPage(page);

    // Verify toolbar elements using data-testid
    await expect(page.getByTestId('recipes-search-input')).toBeVisible();
    await expect(page.getByTestId('recipes-sort-select')).toBeVisible();
    await expect(page.getByTestId('recipes-sort-order-toggle')).toBeVisible();
    await expect(page.getByTestId('recipes-view-grid-button')).toBeVisible();
    await expect(page.getByTestId('recipes-view-list-button')).toBeVisible();
    await expect(page.getByTestId('recipes-new-recipe-button')).toBeVisible();

    // Verify through page objects (which use data-testid internally)
    await expect(recipesPage.searchInput).toBeVisible();
    await expect(recipesPage.sortDropdown).toBeVisible();
    await expect(recipesPage.viewToggleGrid).toBeVisible();
    await expect(recipesPage.viewToggleList).toBeVisible();
    await expect(recipesPage.createRecipeButton).toBeVisible();
  });

  test('should display empty state when no recipes exist', async ({ page }) => {
    const recipesPage = new RecipesPage(page);

    // Check for empty state using data-testid
    const emptyState = page.getByTestId('recipes-empty-state');
    await expect(emptyState).toBeVisible();

    // Verify create button in empty state
    const createButton = page.getByTestId(
      'recipes-create-first-recipe-button',
    );
    await expect(createButton).toBeVisible();

    // Verify through page object
    await expect(recipesPage.emptyState).toBeVisible();
  });

  test('should switch between grid and list views', async ({ page }) => {
    const recipesPage = new RecipesPage(page);

    // Get view toggle buttons using data-testid
    const gridButton = page.getByTestId('recipes-view-grid-button');
    const listButton = page.getByTestId('recipes-view-list-button');

    // Verify initial state (grid view)
    await expect(gridButton).toBeVisible();
    await expect(listButton).toBeVisible();

    // Switch to list view
    await recipesPage.switchToListView();
    // Grid button should still be visible (for switching back)
    await expect(gridButton).toBeVisible();

    // Switch back to grid view
    await recipesPage.switchToGridView();
    await expect(listButton).toBeVisible();
  });

  test('should interact with search functionality', async ({ page }) => {
    const recipesPage = new RecipesPage(page);

    // Find search input using data-testid
    const searchInput = page.getByTestId('recipes-search-input');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('healthy salad');

    // Wait for debounced search
    await page.waitForTimeout(500);

    // Verify search was performed (either shows results or empty state)
    const emptyState = page.getByTestId('recipes-empty-state');
    const isEmptyStateVisible = await emptyState.isVisible();

    if (isEmptyStateVisible) {
      // No recipes found - verify empty state message
      await expect(emptyState).toContainText('No recipes found');
    }
  });

  test('should interact with sort controls', async ({ page }) => {
    const recipesPage = new RecipesPage(page);

    // Get sort controls using data-testid
    const sortSelect = page.getByTestId('recipes-sort-select');
    const sortOrderToggle = page.getByTestId('recipes-sort-order-toggle');

    await expect(sortSelect).toBeVisible();
    await expect(sortOrderToggle).toBeVisible();

    // Change sort order
    await sortSelect.selectOption('title');

    // Toggle sort direction
    await sortOrderToggle.click();

    // Verify controls are still interactive
    await expect(sortSelect).toBeEnabled();
    await expect(sortOrderToggle).toBeEnabled();
  });

  test('should navigate to create recipe page', async ({ page }) => {
    const recipesPage = new RecipesPage(page);

    // Find and click create recipe button using data-testid
    const createButton = page.getByTestId('recipes-new-recipe-button');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Should navigate to new recipe page
    await expect(page).toHaveURL(/\/recipes\/new/);
  });

  test('should display header navigation elements', async ({ page }) => {
    // Verify header elements using data-testid
    const logoLink = page.getByTestId('header-logo-link');
    const recipesLink = page.getByTestId('header-recipes-link');
    const userEmail = page.getByTestId('header-user-email');
    const signOutButton = page.getByTestId('header-signout-button');

    await expect(logoLink).toBeVisible();
    await expect(recipesLink).toBeVisible();
    await expect(signOutButton).toBeVisible();

    // User email might be hidden on small screens
    if (await userEmail.isVisible()) {
      await expect(userEmail).toContainText('@example.com');
    }
  });

  test('should sign out using header button', async ({ page }) => {
    // Find sign out button using data-testid
    const signOutButton = page.getByTestId('header-signout-button');
    await expect(signOutButton).toBeVisible();

    // Click sign out
    await signOutButton.click();

    // Should redirect to sign in page
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    // Should display sign in page elements
    await expect(page.getByTestId('signin-email-input')).toBeVisible();
  });

  test('should display password toggle buttons', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/sign-in');

    // Verify password input exists
    const passwordInput = page.getByTestId('signin-password-input');
    await expect(passwordInput).toBeVisible();

    // Verify toggle button exists (with -toggle suffix)
    const passwordToggle = page.getByTestId('signin-password-input-toggle');
    await expect(passwordToggle).toBeVisible();

    // Click toggle to show password
    await passwordToggle.click();

    // Verify input type changed to text
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await passwordToggle.click();

    // Verify input type changed back to password
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

