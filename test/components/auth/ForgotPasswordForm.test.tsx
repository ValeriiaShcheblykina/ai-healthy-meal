import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Form Rendering', () => {
    it('should render email input and submit button', () => {
      render(<ForgotPasswordForm />);

      expect(
        screen.getByTestId('forgot-password-email-input')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('forgot-password-submit-button')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('forgot-password-signin-link')
      ).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(<ForgotPasswordForm />);

      expect(
        screen.getByText(
          /enter your email address and we'll send you instructions/i
        )
      ).toBeInTheDocument();
    });

    it('should have proper autocomplete attribute', () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
    });
  });

  describe('Form Validation', () => {
    it('should validate email on blur', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      await user.click(emailInput);
      await user.clear(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(
          screen.queryByText(/please enter a valid email address/i)
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

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('forgot-password-error-message')
        ).toBeInTheDocument();
      });

      await user.type(emailInput, 'x');

      await waitFor(() => {
        expect(
          screen.queryByTestId('forgot-password-error-message')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid email', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Reset instructions sent' }),
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/auth/forgot-password',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({ email: 'test@example.com' }),
          })
        );
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Reset instructions sent' }),
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('forgot-password-success-message')
        ).toBeInTheDocument();
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(
          screen.getByText(/if an account exists with this email/i)
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

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Sending...');
        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
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
          error: { message: 'Email not found' },
        }),
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('forgot-password-error-message')
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('forgot-password-error-message')
        ).toHaveTextContent('Email not found');
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('forgot-password-error-message')
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('forgot-password-error-message')
        ).toHaveTextContent('An unexpected error occurred');
      });
    });

    it('should display validation errors for invalid form data', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByTestId('forgot-password-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
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

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('forgot-password-success-message')
        ).toBeInTheDocument();
        expect(screen.getByText('Check your email')).toBeInTheDocument();
        expect(
          screen.getByText(
            /if an account exists with this email, you will receive password reset instructions/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should show back to sign in link in success state', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Success' }),
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const link = screen.getByTestId('forgot-password-back-to-signin-link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/sign-in');
        expect(link).toHaveTextContent('Back to Sign In');
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

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('forgot-password-email-input')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('forgot-password-submit-button')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Links', () => {
    it('should have sign in link', () => {
      render(<ForgotPasswordForm />);

      const link = screen.getByTestId('forgot-password-signin-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/sign-in');
      expect(link).toHaveTextContent('Sign in');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      expect(emailInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have error message with proper role', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Error' } }),
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId(
          'forgot-password-error-message'
        );
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

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId('forgot-password-email-input');
      const submitButton = screen.getByTestId('forgot-password-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByTestId(
          'forgot-password-success-message'
        );
        expect(successMessage).toHaveAttribute('role', 'status');
      });
    });
  });
});
