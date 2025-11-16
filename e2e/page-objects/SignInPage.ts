import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Sign In page
 */
export class SignInPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('signin-email-input');
    this.passwordInput = page.getByTestId('signin-password-input');
    this.signInButton = page.getByTestId('signin-submit-button');
    this.errorMessage = page.getByTestId('signin-error-message');
    this.forgotPasswordLink = page.getByTestId('signin-forgot-password-link');
    this.signUpLink = page.getByTestId('signin-signup-link');
  }

  /**
   * Navigate to the sign in page
   */
  async goto() {
    await super.goto('/sign-in');
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.click(this.signInButton);
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  /**
   * Click on forgot password link
   */
  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
  }

  /**
   * Click on sign up link
   */
  async clickSignUpLink() {
    await this.click(this.signUpLink);
  }
}
