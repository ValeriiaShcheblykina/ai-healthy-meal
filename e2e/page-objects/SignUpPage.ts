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
   * Helper method to reliably fill a field without clearing unnecessarily
   */
  private async fillFieldReliably(
    locator: Locator,
    value: string,
    fieldName: string
  ) {
    // Click to focus the field
    await locator.click();
    await this.page.waitForTimeout(100);

    // Select all existing text first, then type new value
    // Try both Meta+A (Mac) and Control+A (Windows/Linux)
    try {
      await this.page.keyboard.press('Meta+A');
    } catch {
      await this.page.keyboard.press('Control+A');
    }
    await this.page.waitForTimeout(50);

    // Type the new value
    await locator.type(value, { delay: 0 });
    await this.page.waitForTimeout(300); // Wait for React state update

    // Verify the field was filled correctly
    let fieldValue = await locator.inputValue();
    if (fieldValue !== value) {
      // Try one more time with a different approach
      await locator.click();
      await this.page.waitForTimeout(100);
      try {
        await this.page.keyboard.press('Meta+A');
      } catch {
        await this.page.keyboard.press('Control+A');
      }
      await this.page.waitForTimeout(50);
      await locator.pressSequentially(value, { delay: 0 });
      await this.page.waitForTimeout(300);
      fieldValue = await locator.inputValue();
      if (fieldValue !== value) {
        throw new Error(
          `${fieldName} fill failed. Expected: "${value}", Got: "${fieldValue}"`
        );
      }
    }
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
    // Fill all fields using reliable method - ensure confirmPassword is filled last
    await this.fillFieldReliably(this.emailInput, email, 'Email');
    await this.fillFieldReliably(
      this.displayNameInput,
      displayName,
      'DisplayName'
    );
    await this.fillFieldReliably(this.passwordInput, password, 'Password');
    // CRITICAL: Fill confirmPassword last and ensure it's filled before submit
    await this.fillFieldReliably(
      this.confirmPasswordInput,
      confirmPassword,
      'ConfirmPassword'
    );

    // Final verification: ensure ALL fields are filled before submitting
    // Check multiple times to catch any race conditions
    let finalEmail = await this.emailInput.inputValue();
    const finalPassword = await this.passwordInput.inputValue();
    const finalConfirmPassword = await this.confirmPasswordInput.inputValue();
    const finalDisplayName = await this.displayNameInput.inputValue();

    // If email is empty or wrong, refill it immediately before submit
    if (finalEmail !== email) {
      console.warn(
        `Email field lost value before submit. Refilling: "${finalEmail}" -> "${email}"`
      );
      await this.emailInput.click();
      await this.page.waitForTimeout(50);
      try {
        await this.page.keyboard.press('Meta+A');
      } catch {
        await this.page.keyboard.press('Control+A');
      }
      await this.page.waitForTimeout(50);
      await this.emailInput.type(email, { delay: 0 });
      await this.page.waitForTimeout(200);
      finalEmail = await this.emailInput.inputValue();
    }

    if (
      finalEmail !== email ||
      finalPassword !== password ||
      finalConfirmPassword !== confirmPassword ||
      finalDisplayName !== displayName
    ) {
      throw new Error(
        `Form fields not properly filled before submission. Email: ${finalEmail === email} (got: "${finalEmail}", expected: "${email}"), Password: ${finalPassword === password}, ConfirmPassword: ${finalConfirmPassword === confirmPassword}, DisplayName: ${finalDisplayName === displayName} (got: "${finalDisplayName}", expected: "${displayName}")`
      );
    }

    // Wait a moment for any async validation to complete
    await this.page.waitForTimeout(500);

    // Final check right before clicking submit - ensure email is still there
    const lastEmailCheck = await this.emailInput.inputValue();
    if (lastEmailCheck !== email) {
      // Emergency refill if email was cleared - use evaluate to set directly
      await this.emailInput.evaluate((el: HTMLInputElement, val: string) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, email);
      await this.page.waitForTimeout(300);

      // Verify it was set
      const verifyEmail = await this.emailInput.inputValue();
      if (verifyEmail !== email) {
        throw new Error(
          `Email field cannot be set before submit. Expected: "${email}", Got: "${verifyEmail}"`
        );
      }
    }

    // Only click submit after all fields are verified
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
   * Get field-level error message for a specific field
   */
  async getFieldError(fieldId: string): Promise<string> {
    const errorElement = this.page.locator(`#${fieldId}-error`);
    if (await this.isVisible(errorElement)) {
      return await this.getText(errorElement);
    }
    return '';
  }

  /**
   * Check if there are any field-level validation errors
   */
  async hasFieldErrors(): Promise<boolean> {
    const confirmPasswordError = await this.getFieldError('confirmPassword');
    const passwordError = await this.getFieldError('password');
    const emailError = await this.getFieldError('email');
    return !!(confirmPasswordError || passwordError || emailError);
  }

  /**
   * Click on sign in link
   */
  async clickSignInLink() {
    await this.click(this.signInLink);
  }
}
