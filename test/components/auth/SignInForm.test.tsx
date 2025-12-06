import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from '@/components/auth/SignInForm';

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SignInForm', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockLocation.href = '';
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<SignInForm />);

      expect(screen.getByTestId('signin-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('signin-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('signin-submit-button')).toBeInTheDocument();
      expect(
        screen.getByTestId('signin-forgot-password-link')
      ).toBeInTheDocument();
      expect(screen.getByTestId('signin-signup-link')).toBeInTheDocument();
    });

    it('should have proper labels and placeholders', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('you@example.com')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your password')
      ).toBeInTheDocument();
    });

    it('should have proper autocomplete attributes', () => {
      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');

      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Form Validation', () => {
    it('should validate email on blur', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      await user.click(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate password on blur', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const passwordInput = screen.getByTestId('signin-password-input');
      await user.click(passwordInput);
      await user.clear(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
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
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Invalid credentials' } }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('signin-error-message')).toBeInTheDocument();
      });

      await user.type(emailInput, 'x');

      await waitFor(() => {
        expect(
          screen.queryByTestId('signin-error-message')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Signed in successfully' }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/auth/sign-in',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
            credentials: 'include',
          })
        );
      });

      await waitFor(() => {
        expect(mockLocation.href).toBe('/recipes');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: ((value: Response) => void) | undefined;
      const delayedResponse = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedResponse);

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Signing in...');
        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
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
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          error: { message: 'Invalid email or password' },
        }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('signin-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('signin-error-message')).toHaveTextContent(
          'Invalid email or password'
        );
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('signin-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('signin-error-message')).toHaveTextContent(
          'Network error'
        );
      });
    });

    it('should handle non-JSON error responses', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        text: async () => 'Server error occurred',
      });

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('signin-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('signin-error-message')).toHaveTextContent(
          'Server error occurred'
        );
      });
    });

    it('should display validation errors for invalid form data', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const submitButton = screen.getByTestId('signin-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i) ||
            screen.getByText(/password is required/i)
        ).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Links', () => {
    it('should have forgot password link', () => {
      render(<SignInForm />);

      const link = screen.getByTestId('signin-forgot-password-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/forgot-password');
      expect(link).toHaveTextContent('Forgot password?');
    });

    it('should have sign up link', () => {
      render(<SignInForm />);

      const link = screen.getByTestId('signin-signup-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/sign-up');
      expect(link).toHaveTextContent('Sign up');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have error message with proper role', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: { message: 'Error' } }),
      });

      render(<SignInForm />);

      const emailInput = screen.getByTestId('signin-email-input');
      const passwordInput = screen.getByTestId('signin-password-input');
      const submitButton = screen.getByTestId('signin-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId('signin-error-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
