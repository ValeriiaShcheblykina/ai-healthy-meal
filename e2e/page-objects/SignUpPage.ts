import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Sign Up page
 */
export class SignUpPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly displayNameInput: Locator;
  readonly signUpButton: Locator;
  readonly errorMessage: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('signup-email-input');
    this.passwordInput = page.getByTestId('signup-password-input');
    this.confirmPasswordInput = page.getByTestId(
      'signup-confirmpassword-input'
    );
    this.displayNameInput = page.getByTestId('signup-displayname-input');
    this.signUpButton = page.getByTestId('signup-submit-button');
    this.errorMessage = page.getByTestId('signup-error-message');
    this.signInLink = page.getByTestId('signup-signin-link');
  }

  /**
   * Navigate to the sign up page
   */
  async goto() {
    await super.goto('/sign-up');
  }

  /**
   * Sign up with user details
   */
  async signUp(
    email: string,
    password: string,
    confirmPassword: string,
    displayName: string
  ) {
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.fillField(this.confirmPasswordInput, confirmPassword);
    await this.fillField(this.displayNameInput, displayName);
    await this.click(this.signUpButton);
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
   * Click on sign in link
   */
  async clickSignInLink() {
    await this.click(this.signInLink);
  }
}
