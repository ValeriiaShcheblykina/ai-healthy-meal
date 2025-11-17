import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Recipes page
 */
export class RecipesPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchBar: Locator; // Alias for searchInput for backward compatibility
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
    this.searchInput = page.getByTestId('recipes-search-input');
    this.searchBar = this.searchInput; // Alias for backward compatibility
    this.sortDropdown = page.getByTestId('recipes-sort-select');
    this.viewToggleGrid = page.getByTestId('recipes-view-grid-button');
    this.viewToggleList = page.getByTestId('recipes-view-list-button');
    this.recipeCards = page.getByTestId('recipe-card');
    this.emptyState = page.getByTestId('recipes-empty-state');
    this.paginationNext = page.getByTestId('recipes-pagination-next');
    this.paginationPrev = page.getByTestId('recipes-pagination-prev');
    this.createRecipeButton = page.getByTestId('recipes-new-recipe-button');
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
