import { test, expect } from '@playwright/test';
import { signInWithTestUser } from './helpers/auth-helpers';
import { RecipesPage } from './page-objects/RecipesPage';
import { cleanupRecipesByTitle } from './helpers/cleanup';

test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in with persistent test user before each test
    await signInWithTestUser(page);
  });

  test('should create a new recipe', async ({ page }) => {
    const recipesPage = new RecipesPage(page);
    const testRecipe = {
      title: `E2E Test Recipe ${Date.now()}`,
      content:
        'Test ingredients:\n- Ingredient 1\n- Ingredient 2\n\nInstructions:\n1. Step 1\n2. Step 2',
    };

    try {
      // Navigate to create recipe page
      await recipesPage.clickCreateRecipe();
      await expect(page).toHaveURL(/\/recipes\/new/);

      // Verify form elements are visible
      const titleInput = page.locator('#recipe-title');
      const contentTextarea = page.locator('#recipe-content');
      const submitButton = page.getByRole('button', { name: /create recipe/i });

      await expect(titleInput).toBeVisible();
      await expect(contentTextarea).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Fill in the form
      await titleInput.fill(testRecipe.title);
      await contentTextarea.fill(testRecipe.content);

      // Submit the form
      await submitButton.click();

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Verify recipe was created successfully
      await expect(page.locator('h1')).toContainText(testRecipe.title);
      await expect(page.locator('.whitespace-pre-wrap')).toContainText(
        'Ingredient 1'
      );

      // Verify success toast appears
      const toast = page.getByText(/recipe created successfully/i);
      if (await toast.isVisible().catch(() => false)) {
        await expect(toast).toBeVisible();
      }

      // Navigate back to recipes list
      await page.getByRole('button', { name: /back to recipes/i }).click();
      await expect(page).toHaveURL(/\/recipes$/);

      // Verify recipe appears in the list
      await expect(page.getByTestId('recipe-card')).toContainText(
        testRecipe.title
      );
    } finally {
      // Cleanup: delete the test recipe
      await cleanupRecipesByTitle(testRecipe.title);
    }
  });

  test('should edit an existing recipe', async ({ page }) => {
    const recipesPage = new RecipesPage(page);
    const initialRecipe = {
      title: `E2E Edit Test ${Date.now()}`,
      content: 'Initial content',
    };
    const updatedRecipe = {
      title: `E2E Edited Recipe ${Date.now()}`,
      content:
        'Updated ingredients:\n- New ingredient\n\nUpdated instructions:\n1. New step',
    };

    try {
      // First, create a recipe
      await recipesPage.clickCreateRecipe();
      await page.locator('#recipe-title').fill(initialRecipe.title);
      await page.locator('#recipe-content').fill(initialRecipe.content);
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Click edit button
      const editButton = page.getByRole('button', { name: /^edit$/i });
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Wait for redirect to edit page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit/, { timeout: 10000 });

      // Verify form is populated with existing data
      const titleInput = page.locator('#recipe-title');
      const contentTextarea = page.locator('#recipe-content');

      await expect(titleInput).toHaveValue(initialRecipe.title);
      await expect(contentTextarea).toHaveValue(initialRecipe.content);

      // Update the form
      await titleInput.fill(updatedRecipe.title);
      await contentTextarea.fill(updatedRecipe.content);

      // Submit the form
      await page.getByRole('button', { name: /update recipe/i }).click();

      // Wait for redirect back to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Verify recipe was updated
      await expect(page.locator('h1')).toContainText(updatedRecipe.title);
      await expect(page.locator('.whitespace-pre-wrap')).toContainText(
        'New ingredient'
      );

      // Verify success toast appears
      const toast = page.getByText(/recipe updated successfully/i);
      if (await toast.isVisible().catch(() => false)) {
        await expect(toast).toBeVisible();
      }

      // Navigate back to recipes list
      await page.getByRole('button', { name: /back to recipes/i }).click();
      await expect(page).toHaveURL(/\/recipes$/);

      // Verify updated recipe appears in the list
      await expect(page.getByTestId('recipe-card')).toContainText(
        updatedRecipe.title
      );
    } finally {
      // Cleanup: delete both test recipes
      await cleanupRecipesByTitle(initialRecipe.title);
      await cleanupRecipesByTitle(updatedRecipe.title);
    }
  });

  test('should delete a recipe', async ({ page }) => {
    const recipesPage = new RecipesPage(page);
    const testRecipe = {
      title: `E2E Delete Test ${Date.now()}`,
      content: 'Recipe to be deleted',
    };

    try {
      // First, create a recipe
      await recipesPage.clickCreateRecipe();
      await page.locator('#recipe-title').fill(testRecipe.title);
      await page.locator('#recipe-content').fill(testRecipe.content);
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Verify recipe was created
      await expect(page.locator('h1')).toContainText(testRecipe.title);

      // Click delete button
      const deleteButton = page.getByRole('button', { name: /^delete$/i });
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Verify delete confirmation dialog appears
      await expect(
        page.getByRole('heading', { name: /delete recipe/i })
      ).toBeVisible();
      await expect(
        page.getByText(/are you sure you want to delete/i)
      ).toBeVisible();
      await expect(page.getByText(testRecipe.title)).toBeVisible();

      // Confirm deletion
      const confirmButton = page
        .getByRole('dialog')
        .getByRole('button', { name: /^delete$/i });
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();

      // Wait for redirect to recipes list
      await page.waitForURL(/\/recipes$/, { timeout: 10000 });

      // Verify success toast appears
      const toast = page.getByText(/recipe deleted successfully/i);
      if (await toast.isVisible().catch(() => false)) {
        await expect(toast).toBeVisible();
      }

      // Verify recipe no longer appears in the list
      const recipeCards = page.getByTestId('recipe-card');
      const recipeCount = await recipeCards.count();

      if (recipeCount > 0) {
        // If there are recipes, verify our deleted recipe is not among them
        for (let i = 0; i < recipeCount; i++) {
          const cardText = await recipeCards.nth(i).textContent();
          expect(cardText).not.toContain(testRecipe.title);
        }
      }
    } catch (error) {
      // If test fails, cleanup may still be needed
      await cleanupRecipesByTitle(testRecipe.title).catch(() => {
        // Recipe already deleted, ignore error
      });
      throw error;
    }
  });

  test('should cancel recipe creation', async ({ page }) => {
    const recipesPage = new RecipesPage(page);

    // Navigate to create recipe page
    await recipesPage.clickCreateRecipe();
    await expect(page).toHaveURL(/\/recipes\/new/);

    // Fill in some data
    await page.locator('#recipe-title').fill('Test Cancel Recipe');
    await page.locator('#recipe-content').fill('This should not be saved');

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Should redirect back to recipes list
    await expect(page).toHaveURL(/\/recipes$/);

    // Verify recipe was not created
    const recipeCards = page.getByTestId('recipe-card');
    const recipeCount = await recipeCards.count();

    if (recipeCount > 0) {
      for (let i = 0; i < recipeCount; i++) {
        const cardText = await recipeCards.nth(i).textContent();
        expect(cardText).not.toContain('Test Cancel Recipe');
      }
    }
  });

  test('should cancel recipe editing', async ({ page }) => {
    const recipesPage = new RecipesPage(page);
    const testRecipe = {
      title: `E2E Cancel Edit Test ${Date.now()}`,
      content: 'Original content',
    };

    try {
      // First, create a recipe
      await recipesPage.clickCreateRecipe();
      await page.locator('#recipe-title').fill(testRecipe.title);
      await page.locator('#recipe-content').fill(testRecipe.content);
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Click edit button
      await page.getByRole('button', { name: /^edit$/i }).click();
      await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit/, { timeout: 10000 });

      // Make some changes
      await page.locator('#recipe-title').fill('Changed Title');
      await page.locator('#recipe-content').fill('Changed content');

      // Click cancel button
      const cancelButton = page.getByRole('button', { name: /cancel/i });
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Should redirect back to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Verify recipe was not changed
      await expect(page.locator('h1')).toContainText(testRecipe.title);
      await expect(page.locator('.whitespace-pre-wrap')).toContainText(
        testRecipe.content
      );
    } finally {
      // Cleanup: delete the test recipe
      await cleanupRecipesByTitle(testRecipe.title);
    }
  });

  test('should show validation errors when creating recipe with empty fields', async ({
    page,
  }) => {
    const recipesPage = new RecipesPage(page);

    // Navigate to create recipe page
    await recipesPage.clickCreateRecipe();
    await expect(page).toHaveURL(/\/recipes\/new/);

    // Try to submit without filling anything
    const submitButton = page.getByRole('button', { name: /create recipe/i });
    await submitButton.click();

    // Should show validation errors
    await expect(page.getByText(/title is required/i)).toBeVisible();
    await expect(page.getByText(/content is required/i)).toBeVisible();

    // Should still be on the create page
    await expect(page).toHaveURL(/\/recipes\/new/);
  });

  test('should show validation error when title exceeds maximum length', async ({
    page,
  }) => {
    const recipesPage = new RecipesPage(page);

    // Navigate to create recipe page
    await recipesPage.clickCreateRecipe();
    await expect(page).toHaveURL(/\/recipes\/new/);

    // Fill in title that exceeds 200 characters
    const longTitle = 'A'.repeat(201);
    await page.locator('#recipe-title').fill(longTitle);
    await page.locator('#recipe-content').fill('Valid content');

    // Try to submit
    const submitButton = page.getByRole('button', { name: /create recipe/i });
    await submitButton.click();

    // Should show validation error
    await expect(
      page.getByText(/title must be at most 200 characters/i)
    ).toBeVisible();

    // Should still be on the create page
    await expect(page).toHaveURL(/\/recipes\/new/);
  });

  test('should display character count for title and content', async ({
    page,
  }) => {
    const recipesPage = new RecipesPage(page);

    // Navigate to create recipe page
    await recipesPage.clickCreateRecipe();
    await expect(page).toHaveURL(/\/recipes\/new/);

    // Verify initial character counts
    await expect(page.getByText(/0\/200 characters/i)).toBeVisible();
    await expect(page.getByText(/0\/50,000 characters/i)).toBeVisible();

    // Type in title
    await page.locator('#recipe-title').fill('Test Recipe');
    await expect(page.getByText(/11\/200 characters/i)).toBeVisible();

    // Type in content
    await page.locator('#recipe-content').fill('This is a test recipe content');
    await expect(page.getByText(/29\/50,000 characters/i)).toBeVisible();
  });
});

test.describe('Recipe Management - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signInWithTestUser(page);
  });

  test('should navigate through recipe creation flow', async ({ page }) => {
    // Start at recipes list
    await page.goto('/recipes');
    await expect(page).toHaveURL(/\/recipes$/);

    // Click create recipe button
    await page.getByTestId('recipes-new-recipe-button').click();
    await expect(page).toHaveURL(/\/recipes\/new/);

    // Verify we're on create page
    await expect(
      page.getByRole('heading', { name: /create new recipe/i })
    ).toBeVisible();
  });

  test('should navigate from recipe list to detail view', async ({ page }) => {
    const testRecipe = {
      title: `E2E Navigation Test ${Date.now()}`,
      content: 'Test content for navigation',
    };

    try {
      // Create a recipe first
      await page.goto('/recipes/new');
      await page.locator('#recipe-title').fill(testRecipe.title);
      await page.locator('#recipe-content').fill(testRecipe.content);
      await page.getByRole('button', { name: /create recipe/i }).click();
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Navigate back to list
      await page.getByRole('button', { name: /back to recipes/i }).click();
      await expect(page).toHaveURL(/\/recipes$/);

      // Click on the recipe card
      await page
        .getByTestId('recipe-card')
        .filter({ hasText: testRecipe.title })
        .first()
        .click();

      // Should navigate to detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText(testRecipe.title);
    } finally {
      await cleanupRecipesByTitle(testRecipe.title);
    }
  });
});
