import type { Page, Locator } from '@playwright/test';

/**
 * Base Page Object containing common functionality for all pages
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill a form field
   */
  async fillField(locator: Locator, value: string) {
    await locator.fill(value);
  }

  /**
   * Click an element
   */
  async click(locator: Locator) {
    await locator.click();
  }

  /**
   * Get text content of an element
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }
}
