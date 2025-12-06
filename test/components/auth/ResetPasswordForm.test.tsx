import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Form Rendering', () => {
    it('should render password fields when token is provided', () => {
      render(<ResetPasswordForm token="valid-token" />);

      expect(
        screen.getByTestId('reset-password-password-input')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('reset-password-confirmpassword-input')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('reset-password-submit-button')
      ).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(<ResetPasswordForm token="valid-token" />);

      expect(
        screen.getByText(/enter your new password below/i)
      ).toBeInTheDocument();
    });

    it('should have proper autocomplete attributes', () => {
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );

      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(confirmPasswordInput).toHaveAttribute(
        'autoComplete',
        'new-password'
      );
    });

    it('should show error message when token is missing', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
      expect(
        screen.getByText(/this password reset link is invalid or has expired/i)
      ).toBeInTheDocument();
    });

    it('should show request new reset link button when token is missing', () => {
      render(<ResetPasswordForm />);

      const link = screen.getByRole('link', {
        name: /request new reset link/i,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Form Validation', () => {
    it('should validate password on blur', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      await user.click(passwordInput);
      await user.clear(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate password length', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      await user.type(passwordInput, 'short');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate confirm password matches', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');
      await user.click(screen.getByTestId('reset-password-submit-button'));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      await user.type(passwordInput, 'short');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });

      await user.clear(passwordInput);
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        expect(
          screen.queryByText(/password must be at least 8 characters/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should clear global error when user starts typing', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Error occurred' } }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('reset-password-error-message')
        ).toBeInTheDocument();
      });

      await user.type(passwordInput, 'x');

      await waitFor(() => {
        expect(
          screen.queryByTestId('reset-password-error-message')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data and token', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Password reset successful' }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/auth/reset-password',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              password: 'NewPassword123',
              confirmPassword: 'NewPassword123',
            }),
          })
        );
      });
    });

    it('should not submit when token is missing', async () => {
      render(<ResetPasswordForm />);

      // Form should not be rendered when token is missing
      expect(
        screen.queryByTestId('reset-password-submit-button')
      ).not.toBeInTheDocument();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Password reset successful' }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('reset-password-success-message')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Password reset successful')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/your password has been successfully reset/i)
        ).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: ((value: Response) => void) | undefined;
      const delayedResponse = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedResponse);

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Resetting password...');
        expect(submitButton).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(confirmPasswordInput).toBeDisabled();
      });

      if (resolvePromise) {
        resolvePromise({
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ message: 'Success' }),
        } as Response);
      }
    });

    it('should display error message on API error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          error: { message: 'Invalid or expired token' },
        }),
      });

      render(<ResetPasswordForm token="invalid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('reset-password-error-message')
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('reset-password-error-message')
        ).toHaveTextContent('Invalid or expired token');
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('reset-password-error-message')
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('reset-password-error-message')
        ).toHaveTextContent('An unexpected error occurred');
      });
    });

    it('should display validation errors for invalid form data', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" />);

      const submitButton = screen.getByTestId('reset-password-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        const passwordError = screen.queryByText(
          /password must be at least 8 characters/i
        );
        const confirmPasswordError = screen.queryByText(
          /please confirm your password/i
        );
        expect(passwordError || confirmPasswordError).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Success State', () => {
    it('should render success message with correct content', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Success' }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('reset-password-success-message')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Password reset successful')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/your password has been successfully reset/i)
        ).toBeInTheDocument();
      });
    });

    it('should show sign in link in success state', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Success' }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        const link = screen.getByTestId('reset-password-signin-link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/sign-in');
        expect(link).toHaveTextContent('Continue to Sign In');
      });
    });

    it('should not show form in success state', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Success' }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('reset-password-password-input')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('reset-password-confirmpassword-input')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('reset-password-submit-button')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Token Handling', () => {
    it('should display error when token is undefined', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });

    it('should display error when token is empty string', () => {
      render(<ResetPasswordForm token="" />);

      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });

    it('should prevent submission when token is missing', async () => {
      render(<ResetPasswordForm />);

      // Form should not be rendered
      expect(
        screen.queryByTestId('reset-password-submit-button')
      ).not.toBeInTheDocument();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );

      expect(passwordInput).toHaveAttribute('aria-required', 'true');
      expect(confirmPasswordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have error message with proper role', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Error' } }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId('reset-password-error-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have success message with proper role', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Success' }),
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByTestId('reset-password-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'reset-password-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('reset-password-submit-button');

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmPasswordInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByTestId(
          'reset-password-success-message'
        );
        expect(successMessage).toHaveAttribute('role', 'status');
      });
    });
  });
});
