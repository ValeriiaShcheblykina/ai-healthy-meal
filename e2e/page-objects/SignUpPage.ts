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
    // Fill email field with explicit steps to ensure it works
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.fill(email);

    // Verify email was filled correctly
    const emailValue = await this.emailInput.inputValue();
    if (emailValue !== email) {
      console.error(
        `Email fill failed. Expected: ${email}, Got: ${emailValue}`
      );
      // Try again with pressSequentially
      await this.emailInput.clear();
      await this.emailInput.pressSequentially(email);
    }

    // Fill other fields in order
    await this.fillField(this.displayNameInput, displayName);
    await this.fillField(this.passwordInput, password);
    await this.fillField(this.confirmPasswordInput, confirmPassword);

    // Wait a moment for any async validation to complete
    await this.page.waitForTimeout(500);

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
