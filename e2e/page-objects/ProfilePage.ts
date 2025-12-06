import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Profile page
 */
export class ProfilePage extends BasePage {
  readonly emailInput: Locator;
  readonly displayNameInput: Locator;
  readonly calorieTargetInput: Locator;
  readonly saveButton: Locator;
  readonly generateRecipeButton: Locator;
  readonly globalError: Locator;
  readonly successMessage: Locator;

  // Diet checkboxes
  readonly dietVegan: Locator;
  readonly dietVegetarian: Locator;
  readonly dietPescatarian: Locator;
  readonly dietKeto: Locator;
  readonly dietPaleo: Locator;
  readonly dietHalal: Locator;
  readonly dietKosher: Locator;

  // Tag inputs
  readonly allergensInput: Locator;
  readonly allergensAddButton: Locator;
  readonly dislikedIngredientsInput: Locator;
  readonly dislikedIngredientsAddButton: Locator;

  constructor(page: Page) {
    super(page);
    // Form inputs
    this.emailInput = page.locator('#email');
    this.displayNameInput = page.locator('#displayName');
    this.calorieTargetInput = page.locator('#calorieTarget');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.generateRecipeButton = page.getByTestId(
      'generate-recipe-from-preferences-button'
    );

    // Messages
    this.globalError = page.locator('[role="alert"]').filter({
      hasText: /error|failed/i,
    });
    this.successMessage = page.locator('[role="alert"]').filter({
      hasText: /success|updated/i,
    });

    // Diet checkboxes
    this.dietVegan = page.locator('#diet-vegan');
    this.dietVegetarian = page.locator('#diet-vegetarian');
    this.dietPescatarian = page.locator('#diet-pescatarian');
    this.dietKeto = page.locator('#diet-keto');
    this.dietPaleo = page.locator('#diet-paleo');
    this.dietHalal = page.locator('#diet-halal');
    this.dietKosher = page.locator('#diet-kosher');

    // Tag inputs - use aria-label to find inputs
    this.allergensInput = page.getByLabel('Allergens to avoid');
    this.allergensAddButton = page
      .locator('input[aria-label="Allergens to avoid"]')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: /add/i });
    this.dislikedIngredientsInput = page.getByLabel(
      'Disliked ingredients to avoid'
    );
    this.dislikedIngredientsAddButton = page
      .locator('input[aria-label="Disliked ingredients to avoid"]')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: /add/i });
  }

  /**
   * Navigate to the profile page
   */
  async goto() {
    await super.goto('/profile');
  }

  /**
   * Navigate to profile page from header
   */
  async gotoFromHeader() {
    await this.page.getByTestId('header-profile-link').click();
  }

  /**
   * Fill display name
   */
  async fillDisplayName(value: string) {
    // Focus and select all text to ensure complete replacement
    await this.displayNameInput.click();
    await this.displayNameInput.selectText();
    // Type the new value (will replace selected text)
    await this.displayNameInput.type(value, { delay: 10 });
    // Wait for React state to update
    await this.page.waitForTimeout(100);
  }

  /**
   * Fill calorie target
   */
  async fillCalorieTarget(value: number | string) {
    // Focus and select all text to ensure complete replacement
    await this.calorieTargetInput.click();
    await this.calorieTargetInput.selectText();
    // Type the new value (will replace selected text)
    if (value === '' || value === null) {
      // Clear the field
      await this.page.keyboard.press('Delete');
    } else {
      await this.calorieTargetInput.type(String(value), { delay: 10 });
    }
    // Wait for React state to update
    await this.page.waitForTimeout(100);
  }

  /**
   * Get display name value
   */
  async getDisplayName(): Promise<string> {
    return await this.displayNameInput.inputValue();
  }

  /**
   * Get calorie target value
   */
  async getCalorieTarget(): Promise<string> {
    return await this.calorieTargetInput.inputValue();
  }

  /**
   * Get email value (read-only)
   */
  async getEmail(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /**
   * Toggle a diet checkbox
   */
  async toggleDiet(
    diet:
      | 'vegan'
      | 'vegetarian'
      | 'pescatarian'
      | 'keto'
      | 'paleo'
      | 'halal'
      | 'kosher'
  ) {
    const checkbox = this.getDietCheckbox(diet);
    const label = checkbox.locator('..');

    // Get current state before toggling
    const wasChecked = await checkbox.isChecked().catch(() => false);
    const expectedState = !wasChecked;

    // Click the label that contains the checkbox (checkbox is sr-only, label is clickable)
    await label.click();

    // Wait for the checkbox state to change using Playwright's built-in waiting
    // This is more reliable than waitForFunction
    if (expectedState) {
      await expect(checkbox).toBeChecked({ timeout: 3000 });
    } else {
      await expect(checkbox).not.toBeChecked({ timeout: 3000 });
    }
  }

  /**
   * Check if a diet is selected
   * Uses the checkbox's checked state as the primary indicator
   */
  async isDietSelected(
    diet:
      | 'vegan'
      | 'vegetarian'
      | 'pescatarian'
      | 'keto'
      | 'paleo'
      | 'halal'
      | 'kosher'
  ): Promise<boolean> {
    const checkbox = this.getDietCheckbox(diet);
    // Check the checkbox's checked state directly (most reliable)
    return await checkbox.isChecked().catch(() => false);
  }

  /**
   * Get diet checkbox locator
   */
  private getDietCheckbox(
    diet:
      | 'vegan'
      | 'vegetarian'
      | 'pescatarian'
      | 'keto'
      | 'paleo'
      | 'halal'
      | 'kosher'
  ): Locator {
    switch (diet) {
      case 'vegan':
        return this.dietVegan;
      case 'vegetarian':
        return this.dietVegetarian;
      case 'pescatarian':
        return this.dietPescatarian;
      case 'keto':
        return this.dietKeto;
      case 'paleo':
        return this.dietPaleo;
      case 'halal':
        return this.dietHalal;
      case 'kosher':
        return this.dietKosher;
    }
  }

  /**
   * Add allergen tag
   */
  async addAllergen(tag: string) {
    await this.allergensInput.clear();
    await this.allergensInput.type(tag, { delay: 10 });
    // Press Enter to add tag
    await this.allergensInput.press('Enter');
    // Wait for tag to appear in the DOM
    await this.page.waitForSelector('.bg-primary\\/10', {
      state: 'visible',
      timeout: 5000,
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Add multiple allergen tags (comma-separated)
   */
  async addAllergens(tags: string) {
    await this.allergensInput.clear();
    await this.allergensInput.type(tags, { delay: 10 });
    // Press Enter to add tags (TagInput splits by comma)
    await this.allergensInput.press('Enter');
    // Wait for tags to appear in the DOM - wait for at least one tag
    const tagContainer = this.page
      .locator('input[aria-label="Allergens to avoid"]')
      .locator('..')
      .locator('..')
      .locator('.bg-muted\\/30');
    await tagContainer
      .locator('.bg-primary\\/10')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Remove allergen tag
   */
  async removeAllergen(tag: string) {
    const tagContainer = this.page
      .locator('input[aria-label="Allergens to avoid"]')
      .locator('..')
      .locator('..')
      .locator('.bg-muted\\/30');
    const tagSpan = tagContainer
      .locator('.bg-primary\\/10')
      .filter({ hasText: tag });
    const removeButton = tagSpan.getByRole('button', {
      name: new RegExp(`Remove ${tag}`, 'i'),
    });
    await removeButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Get all allergen tags
   */
  async getAllergens(): Promise<string[]> {
    // Find the tag container (the div with bg-muted/30 that contains all tags)
    const tagContainer = this.page
      .locator('input[aria-label="Allergens to avoid"]')
      .locator('..')
      .locator('..')
      .locator('.bg-muted\\/30'); // Container div with all tags

    // Find all tag spans (each tag is a span with bg-primary/10)
    const tagSpans = tagContainer.locator('.bg-primary\\/10');
    const count = await tagSpans.count();
    const tags: string[] = [];

    for (let i = 0; i < count; i++) {
      const tagSpan = tagSpans.nth(i);
      // Get all text content, then remove button text (X icon)
      const fullText = await tagSpan.textContent();
      if (fullText) {
        // The text is the tag name, button adds nothing visible (just X icon)
        // So we can use the text directly, or get first text node
        const tagText = fullText.trim();
        // Remove any button text if present (shouldn't be, but just in case)
        const cleanText = tagText.replace(/×/g, '').trim();
        if (cleanText) {
          tags.push(cleanText);
        }
      }
    }
    return tags;
  }

  /**
   * Add disliked ingredient tag
   */
  async addDislikedIngredient(tag: string) {
    await this.dislikedIngredientsInput.clear();
    await this.dislikedIngredientsInput.type(tag, { delay: 10 });
    await this.dislikedIngredientsInput.press('Enter');
    // Wait for tag to appear in the DOM
    await this.page.waitForSelector('.bg-primary\\/10', {
      state: 'visible',
      timeout: 5000,
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Add multiple disliked ingredient tags (comma-separated)
   */
  async addDislikedIngredients(tags: string) {
    await this.dislikedIngredientsInput.clear();
    await this.dislikedIngredientsInput.type(tags, { delay: 10 });
    // Press Enter to add tags (TagInput splits by comma)
    await this.dislikedIngredientsInput.press('Enter');
    // Wait for tags to appear in the DOM - wait for at least one tag
    const tagContainer = this.page
      .locator('input[aria-label="Disliked ingredients to avoid"]')
      .locator('..')
      .locator('..')
      .locator('.bg-muted\\/30');
    await tagContainer
      .locator('.bg-primary\\/10')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Remove disliked ingredient tag
   */
  async removeDislikedIngredient(tag: string) {
    const tagContainer = this.page
      .locator('input[aria-label="Disliked ingredients to avoid"]')
      .locator('..')
      .locator('..')
      .locator('.bg-muted\\/30');
    const tagSpan = tagContainer
      .locator('.bg-primary\\/10')
      .filter({ hasText: tag });
    const removeButton = tagSpan.getByRole('button', {
      name: new RegExp(`Remove ${tag}`, 'i'),
    });
    await removeButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Get all disliked ingredient tags
   */
  async getDislikedIngredients(): Promise<string[]> {
    // Find the tag container (the div with bg-muted/30 that contains all tags)
    const tagContainer = this.page
      .locator('input[aria-label="Disliked ingredients to avoid"]')
      .locator('..')
      .locator('..')
      .locator('.bg-muted\\/30'); // Container div with all tags

    // Find all tag spans (each tag is a span with bg-primary/10)
    const tagSpans = tagContainer.locator('.bg-primary\\/10');
    const count = await tagSpans.count();
    const tags: string[] = [];

    for (let i = 0; i < count; i++) {
      const tagSpan = tagSpans.nth(i);
      // Get all text content, then remove button text (X icon)
      const fullText = await tagSpan.textContent();
      if (fullText) {
        // The text is the tag name, button adds nothing visible (just X icon)
        // So we can use the text directly, or get first text node
        const tagText = fullText.trim();
        // Remove any button text if present (shouldn't be, but just in case)
        const cleanText = tagText.replace(/×/g, '').trim();
        if (cleanText) {
          tags.push(cleanText);
        }
      }
    }
    return tags;
  }

  /**
   * Save profile changes
   */
  async saveChanges() {
    await this.click(this.saveButton);
  }

  /**
   * Click generate recipe from preferences button
   */
  async clickGenerateRecipe() {
    await this.click(this.generateRecipeButton);
  }

  /**
   * Check if global error is displayed
   */
  async hasGlobalError(): Promise<boolean> {
    return await this.isVisible(this.globalError);
  }

  /**
   * Get global error message
   */
  async getGlobalError(): Promise<string> {
    return await this.getText(this.globalError);
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.isVisible(this.successMessage);
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  /**
   * Get field-level error message
   */
  async getFieldError(
    fieldName:
      | 'displayName'
      | 'calorieTarget'
      | 'allergens'
      | 'dislikedIngredients'
      | 'diets'
  ): Promise<string> {
    const errorElement = this.page.locator(`#${fieldName}-error`);
    if (await this.isVisible(errorElement)) {
      return await this.getText(errorElement);
    }
    return '';
  }

  /**
   * Check if field has error
   */
  async hasFieldError(
    fieldName:
      | 'displayName'
      | 'calorieTarget'
      | 'allergens'
      | 'dislikedIngredients'
      | 'diets'
  ): Promise<boolean> {
    const errorElement = this.page.locator(`#${fieldName}-error`);
    return await this.isVisible(errorElement);
  }

  /**
   * Check if save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Check if form is in loading state
   */
  async isLoading(): Promise<boolean> {
    const saveButtonText = await this.saveButton.textContent();
    return saveButtonText?.includes('Saving') ?? false;
  }

  /**
   * Wait for profile to save
   */
  async waitForSave() {
    // Wait for either success message or error
    await Promise.race([
      this.page.waitForSelector('[role="alert"]', { timeout: 10000 }),
      this.page.waitForTimeout(5000),
    ]);
  }
}
