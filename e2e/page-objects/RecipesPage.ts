import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Recipes page
 */
export class RecipesPage extends BasePage {
  readonly searchInput: Locator;
  readonly sortDropdown: Locator;
  readonly viewToggleGrid: Locator;
  readonly viewToggleList: Locator;
  readonly recipeCards: Locator;
  readonly emptyState: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;
  readonly createRecipeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i);
    this.sortDropdown = page.getByRole('combobox', { name: /sort/i });
    this.viewToggleGrid = page.getByRole('button', { name: /grid view/i });
    this.viewToggleList = page.getByRole('button', { name: /list view/i });
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
    this.emptyState = page.getByText(/no recipes found/i);
    this.paginationNext = page.getByRole('button', { name: /next/i });
    this.paginationPrev = page.getByRole('button', { name: /previous/i });
    this.createRecipeButton = page.getByRole('button', {
      name: /create recipe/i,
    });
  }

  /**
   * Navigate to the recipes page
   */
  async goto() {
    await super.goto('/recipes');
  }

  /**
   * Search for recipes
   */
  async search(query: string) {
    await this.fillField(this.searchInput, query);
    // Wait for debounced search to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Change sort order
   */
  async changeSort(option: string) {
    await this.click(this.sortDropdown);
    await this.page.getByRole('option', { name: option }).click();
  }

  /**
   * Switch to grid view
   */
  async switchToGridView() {
    await this.click(this.viewToggleGrid);
  }

  /**
   * Switch to list view
   */
  async switchToListView() {
    await this.click(this.viewToggleList);
  }

  /**
   * Get the count of recipe cards
   */
  async getRecipeCount(): Promise<number> {
    return await this.recipeCards.count();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.isVisible(this.emptyState);
  }

  /**
   * Click on a recipe by index
   */
  async clickRecipe(index: number) {
    await this.recipeCards.nth(index).click();
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.click(this.paginationNext);
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.click(this.paginationPrev);
  }

  /**
   * Click create recipe button
   */
  async clickCreateRecipe() {
    await this.click(this.createRecipeButton);
  }
}
