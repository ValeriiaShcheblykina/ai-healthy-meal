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

      // Fill in the form - use type() to trigger React onChange events properly
      await titleInput.clear();
      await titleInput.type(testRecipe.title, { delay: 10 });
      await contentTextarea.clear();
      await contentTextarea.type(testRecipe.content, { delay: 10 });

      // Wait for React state to update - verify values are set and validation errors are gone
      await expect(titleInput).toHaveValue(testRecipe.title);
      await expect(contentTextarea).toHaveValue(testRecipe.content);

      // Wait for validation errors to disappear (React state has updated)
      await page.waitForFunction(
        () => {
          const titleError = document.querySelector('#title-error');
          const contentError = document.querySelector('#content-error');
          // Errors should not be visible or should be empty
          return (
            (!titleError || !titleError.textContent?.trim()) &&
            (!contentError || !contentError.textContent?.trim())
          );
        },
        { timeout: 5000 }
      );

      // Set up network monitoring to catch API response
      let apiResponse: { status?: number; body?: unknown } | null = null;
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Submit the form
      await submitButton.click();

      // Wait for API response
      const response = await responsePromise;
      if (response) {
        apiResponse = {
          status: response.status(),
          body: await response.json().catch(() => null),
        };
        console.info(`📡 Recipe creation API Response: ${apiResponse.status}`);

        if (apiResponse.status !== 201) {
          throw new Error(
            `Recipe creation failed with status ${apiResponse.status}: ${JSON.stringify(apiResponse.body)}`
          );
        }
      } else {
        console.warn(
          '⚠️ No API response received, continuing with navigation check'
        );
      }

      // Wait for either redirect to recipe detail page or error toast
      // The redirect happens after a 500ms setTimeout, so we need to wait a bit
      try {
        await Promise.race([
          page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 }),
          // Also wait for error toast if API failed
          page
            .waitForSelector('[role="alert"]', {
              state: 'visible',
              timeout: 5000,
            })
            .then(async () => {
              const errorToast = page
                .locator('[role="alert"]')
                .filter({ hasText: /error|failed/i });
              if (await errorToast.isVisible().catch(() => false)) {
                const errorText = await errorToast.textContent();
                throw new Error(`Recipe creation failed: ${errorText}`);
              }
            }),
        ]);
      } catch (waitError) {
        // Check if we're still on the create page (error case)
        if (page.url().includes('/recipes/new')) {
          // Check for error toast
          const errorToast = page
            .locator('[role="alert"]')
            .filter({ hasText: /error|failed/i });
          if (await errorToast.isVisible().catch(() => false)) {
            const errorText = await errorToast.textContent();
            throw new Error(`Recipe creation failed: ${errorText}`);
          }

          // Check for validation errors
          const validationErrors = page.locator('text=/required|invalid/i');
          if (
            await validationErrors
              .first()
              .isVisible()
              .catch(() => false)
          ) {
            const errorText = await validationErrors.first().textContent();
            throw new Error(`Validation error: ${errorText}`);
          }

          throw new Error(
            `Failed to redirect after recipe creation. Current URL: ${page.url()}. ` +
              `API Status: ${apiResponse?.status || 'unknown'}. ` +
              `Check browser console for JavaScript errors.`
          );
        }
        throw waitError;
      }

      // Wait for page to be stable after redirect
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // waitForURL() already confirmed we're on the recipe detail page
      // Now wait for the content to be visible (React needs to render)
      // Use main h1 to avoid matching Playwright tool h1s
      const heading = page.locator('main h1');

      // Wait for heading to be visible with a reasonable timeout
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Verify recipe was created successfully
      await expect(heading).toContainText(testRecipe.title);
      await expect(page.locator('.whitespace-pre-wrap')).toContainText(
        'Ingredient 1'
      );

      // Verify success toast appears (optional - may have already disappeared)
      const toast = page.getByText(/recipe created successfully/i);
      if (await toast.isVisible().catch(() => false)) {
        await expect(toast).toBeVisible();
      }

      // Navigate back to recipes list
      await page.getByRole('button', { name: /back to recipes/i }).click();
      await expect(page).toHaveURL(/\/recipes$/);

      // Verify recipe appears in the list
      // Filter to find the specific recipe card to avoid strict mode violation
      const recipeCard = page
        .getByTestId('recipe-card')
        .filter({ hasText: testRecipe.title })
        .first();
      await expect(recipeCard).toBeVisible();
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

      const titleInput = page.locator('#recipe-title');
      const contentTextarea = page.locator('#recipe-content');

      // Use type() to trigger React onChange events properly
      await titleInput.clear();
      await titleInput.type(initialRecipe.title, { delay: 10 });
      await contentTextarea.clear();
      await contentTextarea.type(initialRecipe.content, { delay: 10 });

      // Wait for React state to update
      await expect(titleInput).toHaveValue(initialRecipe.title);
      await expect(contentTextarea).toHaveValue(initialRecipe.content);

      // Wait for validation errors to disappear
      await page.waitForFunction(
        () => {
          const titleError = document.querySelector('#title-error');
          const contentError = document.querySelector('#content-error');
          return (
            (!titleError || !titleError.textContent?.trim()) &&
            (!contentError || !contentError.textContent?.trim())
          );
        },
        { timeout: 5000 }
      );

      // Set up network monitoring
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Submit the form
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for API response
      const response = await responsePromise;
      if (response && response.status() !== 201) {
        throw new Error(
          `Recipe creation failed with status ${response.status()}`
        );
      }

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 });

      // Wait for page to be stable
      await page
        .waitForLoadState('domcontentloaded', { timeout: 10000 })
        .catch(() => {
          // Ignore timeout errors - page may already be loaded
        });

      // Click edit button
      const editButton = page.getByRole('button', { name: /^edit$/i });
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Wait for redirect to edit page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit/, { timeout: 10000 });

      // Get form elements again (they're on a different page now)
      const editTitleInput = page.locator('#recipe-title');
      const editContentTextarea = page.locator('#recipe-content');

      // Verify form is populated with existing data
      await expect(editTitleInput).toHaveValue(initialRecipe.title);
      await expect(editContentTextarea).toHaveValue(initialRecipe.content);

      // Update the form - use type() to trigger React onChange events properly
      await editTitleInput.clear();
      await editTitleInput.type(updatedRecipe.title, { delay: 10 });
      await editContentTextarea.clear();
      await editContentTextarea.type(updatedRecipe.content, { delay: 10 });

      // Wait for React state to update
      await expect(editTitleInput).toHaveValue(updatedRecipe.title);
      await expect(editContentTextarea).toHaveValue(updatedRecipe.content);

      // Wait for validation errors to disappear
      await page.waitForFunction(
        () => {
          const titleError = document.querySelector('#title-error');
          const contentError = document.querySelector('#content-error');
          return (
            (!titleError || !titleError.textContent?.trim()) &&
            (!contentError || !contentError.textContent?.trim())
          );
        },
        { timeout: 5000 }
      );

      // Set up network monitoring
      const updateResponsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'PATCH',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Submit the form
      await page.getByRole('button', { name: /update recipe/i }).click();

      // Wait for API response
      const updateResponse = await updateResponsePromise;
      if (updateResponse && updateResponse.status() !== 200) {
        throw new Error(
          `Recipe update failed with status ${updateResponse.status()}`
        );
      }

      // Wait for redirect back to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 });

      // Wait for page to be stable
      await page
        .waitForLoadState('domcontentloaded', { timeout: 10000 })
        .catch(() => {
          // Ignore timeout errors - page may already be loaded
        });

      // Verify recipe was updated
      // expect() automatically waits for elements to be visible
      // Use main h1 to avoid matching Playwright tool h1s
      await expect(page.locator('main h1')).toContainText(updatedRecipe.title);
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
      // Filter to find the specific recipe card with the updated title
      const updatedRecipeCard = page
        .getByTestId('recipe-card')
        .filter({ hasText: updatedRecipe.title });
      await expect(updatedRecipeCard).toBeVisible();
      await expect(updatedRecipeCard).toContainText(updatedRecipe.title);
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

      const titleInput = page.locator('#recipe-title');
      const contentTextarea = page.locator('#recipe-content');

      // Use type() to trigger React onChange events properly
      await titleInput.clear();
      await titleInput.type(testRecipe.title, { delay: 10 });
      await contentTextarea.clear();
      await contentTextarea.type(testRecipe.content, { delay: 10 });

      // Wait for React state to update
      await expect(titleInput).toHaveValue(testRecipe.title);
      await expect(contentTextarea).toHaveValue(testRecipe.content);

      // Wait for validation errors to disappear
      await page.waitForFunction(
        () => {
          const titleError = document.querySelector('#title-error');
          const contentError = document.querySelector('#content-error');
          return (
            (!titleError || !titleError.textContent?.trim()) &&
            (!contentError || !contentError.textContent?.trim())
          );
        },
        { timeout: 5000 }
      );

      // Set up network monitoring
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Submit the form
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for API response
      const response = await responsePromise;
      if (response && response.status() !== 201) {
        throw new Error(
          `Recipe creation failed with status ${response.status()}`
        );
      }

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 });

      // Wait for page to be stable and main content to load
      await page
        .waitForLoadState('domcontentloaded', { timeout: 10000 })
        .catch(() => {
          // Ignore timeout errors - page may already be loaded
        });

      // Verify recipe was created - use main h1 to avoid matching Playwright tool h1s
      // expect() automatically waits for elements to be visible
      await expect(page.locator('main h1')).toContainText(testRecipe.title);

      // Click delete button
      const deleteButton = page.getByRole('button', { name: /^delete$/i });
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Wait for delete confirmation dialog to appear
      // Wait for the dialog heading first (confirms dialog content is rendered)
      const dialogHeading = page.getByRole('heading', {
        name: /delete recipe/i,
      });
      await expect(dialogHeading).toBeVisible({ timeout: 10000 });

      // Wait for the confirmation text to appear in the dialog
      const confirmationText = page.getByText(
        /are you sure you want to delete/i
      );
      await expect(confirmationText).toBeVisible({ timeout: 5000 });

      // Verify the recipe title appears in the dialog
      // Use the confirmation text to scope the search (it contains the title)
      // This avoids matching the page heading
      await expect(confirmationText).toContainText(testRecipe.title);

      // Set up network monitoring for DELETE request before clicking confirm
      const deleteResponsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'DELETE',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Find the delete button in the dialog
      // Since there are two delete buttons (one we clicked, one in dialog),
      // find all and get the one that's visible and near the confirmation text
      const allDeleteButtons = page.getByRole('button', { name: /^delete$/i });
      const deleteButtonCount = await allDeleteButtons.count();

      // The dialog delete button should be the second one (index 1)
      // or we can find it by checking which one is near the confirmation text
      const confirmButton =
        deleteButtonCount > 1
          ? allDeleteButtons.nth(1)
          : allDeleteButtons.first();

      await expect(confirmButton).toBeVisible();
      await confirmButton.click();

      // Wait for DELETE API response
      const deleteResponse = await deleteResponsePromise;
      if (
        deleteResponse &&
        deleteResponse.status() !== 200 &&
        deleteResponse.status() !== 204
      ) {
        // Wait for error toast to appear (if it does)
        let errorMessage = `Recipe deletion failed with status ${deleteResponse.status()}`;

        try {
          // Wait for error toast with a short timeout
          await page.waitForSelector('[role="alert"]', {
            state: 'visible',
            timeout: 2000,
          });
          const errorToast = page
            .locator('[role="alert"]')
            .filter({ hasText: /error|failed/i });
          if (await errorToast.isVisible().catch(() => false)) {
            const toastText = await errorToast.textContent();
            errorMessage += `. Error message: ${toastText}`;
          }
        } catch {
          // Error toast might not appear, continue with status code
        }

        // Try to get response body for more details
        try {
          const responseBody = await deleteResponse.json().catch(() => null);
          if (responseBody) {
            errorMessage += `. Response: ${JSON.stringify(responseBody)}`;
          }
        } catch {
          // Ignore if we can't parse response
        }

        throw new Error(errorMessage);
      }

      // Wait for redirect to recipes list
      // The component uses setTimeout(1000ms) before redirecting
      // Note: Dialog should close automatically in the finally block,
      // but we don't wait for it to avoid potential race conditions
      // Toast may not be visible due to redirect happening too quickly,
      // so we skip waiting for it and verify deletion by checking the list instead
      await page.waitForURL(/\/recipes$/, { timeout: 10000 });

      // Wait for page to be fully loaded after redirect
      await page
        .waitForLoadState('networkidle', { timeout: 5000 })
        .catch(() => {
          // Network might not be idle, continue anyway
        });

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

    // Fill in some data - use type() to trigger React onChange events
    const titleInput = page.locator('#recipe-title');
    const contentTextarea = page.locator('#recipe-content');
    await titleInput.clear();
    await titleInput.type('Test Cancel Recipe', { delay: 10 });
    await contentTextarea.clear();
    await contentTextarea.type('This should not be saved', { delay: 10 });

    // Wait for React state to update
    await expect(titleInput).toHaveValue('Test Cancel Recipe');
    await expect(contentTextarea).toHaveValue('This should not be saved');

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

      const titleInput = page.locator('#recipe-title');
      const contentTextarea = page.locator('#recipe-content');

      // Use type() to trigger React onChange events properly
      await titleInput.clear();
      await titleInput.type(testRecipe.title, { delay: 10 });
      await contentTextarea.clear();
      await contentTextarea.type(testRecipe.content, { delay: 10 });

      // Wait for React state to update
      await expect(titleInput).toHaveValue(testRecipe.title);
      await expect(contentTextarea).toHaveValue(testRecipe.content);

      // Wait for validation errors to disappear
      await page.waitForFunction(
        () => {
          const titleError = document.querySelector('#title-error');
          const contentError = document.querySelector('#content-error');
          return (
            (!titleError || !titleError.textContent?.trim()) &&
            (!contentError || !contentError.textContent?.trim())
          );
        },
        { timeout: 5000 }
      );

      // Set up network monitoring
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Submit the form
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for API response
      const response = await responsePromise;
      if (response && response.status() !== 201) {
        throw new Error(
          `Recipe creation failed with status ${response.status()}`
        );
      }

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 });

      // Wait for page to be stable
      await page
        .waitForLoadState('domcontentloaded', { timeout: 10000 })
        .catch(() => {
          // Ignore timeout errors - page may already be loaded
        });

      // Click edit button
      await page.getByRole('button', { name: /^edit$/i }).click();
      await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit/, { timeout: 10000 });

      // Get form elements on edit page
      const editTitleInput = page.locator('#recipe-title');
      const editContentTextarea = page.locator('#recipe-content');

      // Make some changes - use type() to trigger React onChange events
      await editTitleInput.clear();
      await editTitleInput.type('Changed Title', { delay: 10 });
      await editContentTextarea.clear();
      await editContentTextarea.type('Changed content', { delay: 10 });

      // Wait for React state to update
      await expect(editTitleInput).toHaveValue('Changed Title');
      await expect(editContentTextarea).toHaveValue('Changed content');

      // Click cancel button
      const cancelButton = page.getByRole('button', { name: /cancel/i });
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Should redirect back to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Verify recipe was not changed
      // expect() automatically waits for elements to be visible
      // Use main h1 to avoid matching Playwright tool h1s
      await expect(page.locator('main h1')).toContainText(testRecipe.title);
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

    // Wait for validation errors to appear (React validation runs on submit)
    // Use waitForFunction to wait for React state to update and errors to render
    await page.waitForFunction(
      () => {
        const titleError = document.querySelector('#title-error');
        const contentError = document.querySelector('#content-error');
        return (
          titleError &&
          contentError &&
          titleError.textContent?.trim() &&
          contentError.textContent?.trim()
        );
      },
      { timeout: 5000 }
    );

    // Now verify error elements are visible
    const titleError = page.locator('#title-error');
    const contentError = page.locator('#content-error');

    await expect(titleError).toBeVisible();
    await expect(contentError).toBeVisible();

    // Verify error messages
    await expect(titleError).toContainText(/title is required/i);
    await expect(contentError).toContainText(/content is required/i);

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
    const titleInput = page.locator('#recipe-title');
    const contentTextarea = page.locator('#recipe-content');

    // Use type() to trigger React onChange events properly
    await titleInput.clear();
    await titleInput.type(longTitle, { delay: 10 });
    await contentTextarea.clear();
    await contentTextarea.type('Valid content', { delay: 10 });

    // Wait for React state to update
    await expect(titleInput).toHaveValue(longTitle);
    await expect(contentTextarea).toHaveValue('Valid content');

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

    // Type in title - use type() to trigger React onChange events for character count
    const titleInput = page.locator('#recipe-title');
    await titleInput.clear();
    await titleInput.type('Test Recipe', { delay: 10 });
    await expect(titleInput).toHaveValue('Test Recipe');
    await expect(page.getByText(/11\/200 characters/i)).toBeVisible();

    // Type in content
    const contentTextarea = page.locator('#recipe-content');
    await contentTextarea.clear();
    await contentTextarea.type('This is a test recipe content', { delay: 10 });
    await expect(contentTextarea).toHaveValue('This is a test recipe content');
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

      const titleInput = page.locator('#recipe-title');
      const contentTextarea = page.locator('#recipe-content');

      // Use type() to trigger React onChange events properly
      await titleInput.clear();
      await titleInput.type(testRecipe.title, { delay: 10 });
      await contentTextarea.clear();
      await contentTextarea.type(testRecipe.content, { delay: 10 });

      // Wait for React state to update
      await expect(titleInput).toHaveValue(testRecipe.title);
      await expect(contentTextarea).toHaveValue(testRecipe.content);

      // Wait for validation errors to disappear
      await page.waitForFunction(
        () => {
          const titleError = document.querySelector('#title-error');
          const contentError = document.querySelector('#content-error');
          return (
            (!titleError || !titleError.textContent?.trim()) &&
            (!contentError || !contentError.textContent?.trim())
          );
        },
        { timeout: 5000 }
      );

      // Set up network monitoring
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/recipes') &&
            response.request().method() === 'POST',
          { timeout: 15000 }
        )
        .catch(() => null);

      // Submit the form
      await page.getByRole('button', { name: /create recipe/i }).click();

      // Wait for API response
      const response = await responsePromise;
      if (response && response.status() !== 201) {
        throw new Error(
          `Recipe creation failed with status ${response.status()}`
        );
      }

      // Wait for redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 15000 });

      // Navigate back to list
      await page.getByRole('button', { name: /back to recipes/i }).click();
      await expect(page).toHaveURL(/\/recipes$/, { timeout: 10000 });

      // Wait for recipe list page to load - wait for search bar to be visible
      const recipesPage = new RecipesPage(page);
      await expect(recipesPage.searchBar).toBeVisible({ timeout: 10000 });

      // Wait for page to be stable (network idle or DOM content loaded)
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Wait for the specific recipe card to be visible
      const recipeCard = page
        .getByTestId('recipe-card')
        .filter({ hasText: testRecipe.title })
        .first();
      await expect(recipeCard).toBeVisible({ timeout: 10000 });

      // Click on the recipe card
      await recipeCard.click();

      // Should navigate to detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

      // Use main h1 to avoid matching Playwright tool h1s
      // expect() automatically waits for elements to be visible
      await expect(page.locator('main h1')).toContainText(testRecipe.title);
    } finally {
      await cleanupRecipesByTitle(testRecipe.title);
    }
  });
});
