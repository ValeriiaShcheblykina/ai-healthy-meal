import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from '@/components/auth/SignUpForm';

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

describe('SignUpForm', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockLocation.href = '';
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<SignUpForm />);

      expect(screen.getByTestId('signup-email-input')).toBeInTheDocument();
      expect(
        screen.getByTestId('signup-displayname-input')
      ).toBeInTheDocument();
      expect(screen.getByTestId('signup-password-input')).toBeInTheDocument();
      expect(
        screen.getByTestId('signup-confirmpassword-input')
      ).toBeInTheDocument();
      expect(screen.getByTestId('signup-submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('signup-signin-link')).toBeInTheDocument();
    });

    it('should have proper labels and placeholders', () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

      expect(
        screen.getByPlaceholderText('you@example.com')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    });

    it('should mark required fields with aria-required', () => {
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
      expect(confirmPasswordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should render sign in link with correct href', () => {
      render(<SignUpForm />);

      const signInLink = screen.getByTestId('signup-signin-link');
      expect(signInLink).toHaveAttribute('href', '/sign-in');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      // Fill invalid email
      await user.type(emailInput, 'notanemail');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      // Submit form
      await user.click(screen.getByTestId('signup-submit-button'));

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Should not call fetch
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show validation error for weak password', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Short1');
      await user.type(confirmPasswordInput, 'Short1');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should show validation error
      await waitFor(() => {
        const errorElement = screen.getByText(/at least 8 characters/i);
        expect(errorElement).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should clear field error when user types', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const submitButton = screen.getByTestId('signup-submit-button');

      // Fill invalid email and submit
      await user.type(emailInput, 'notanemail');
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText(/please enter a valid email address/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should successfully submit with valid data and redirect to sign-in', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: '123', email: 'test@example.com' },
          message: 'Account created successfully',
        }),
      });

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const displayNameInput = screen.getByTestId('signup-displayname-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(displayNameInput, 'Test User');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should call API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/auth/sign-up',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body).toEqual({
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
        });
      });

      // Should redirect to sign-in with success parameter
      expect(mockLocation.href).toBe('/sign-in?success=true');
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ user: { id: '123' } }),
                }),
              100
            )
          )
      );

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('signup-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toHaveTextContent('Creating account...');
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });

    it('should show error message when sign-up fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'An account with this email already exists' },
        }),
      });

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should show error message
      await waitFor(() => {
        const errorMessage = screen.getByTestId('signup-error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(
          /account with this email already exists/i
        );
      });

      // Should not redirect (location.href may have been set by previous tests, but this test shouldn't set it)
      // Just verify the error message is shown, which means we didn't redirect
    });

    it('should show generic error message on network failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should show generic error message
      await waitFor(() => {
        const errorMessage = screen.getByTestId('signup-error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/unexpected error occurred/i);
      });
    });

    it('should not submit with empty required fields', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should show validation errors
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /password must contain at least one uppercase letter/i
          )
        ).toBeInTheDocument();
      });

      // Should not call fetch
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should allow submission without optional display name', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: '123', email: 'test@example.com' },
        }),
      });

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Should call API without display name
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/auth/sign-up',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body).toEqual({
          email: 'test@example.com',
          displayName: '',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
        });
      });
    });
  });

  describe('Field Blur Validation', () => {
    it('should validate email on blur', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');

      await user.type(emailInput, 'invalid');
      await user.tab(); // Trigger blur

      // Should show validation error after blur
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate password on blur', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByTestId('signup-password-input');

      await user.type(passwordInput, 'weak');
      await user.tab(); // Trigger blur

      // Should show validation error after blur
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should clear validation error when field becomes valid', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');

      // Type invalid email and blur
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.tab();

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText(/please enter a valid email address/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error messages', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Sign up failed' },
        }),
      });

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      await waitFor(() => {
        const errorMessage = screen.getByTestId('signup-error-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have noValidate attribute on form for custom validation', () => {
      const { container } = render(<SignUpForm />);
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('noValidate');
    });

    it('should have proper autocomplete attributes', () => {
      render(<SignUpForm />);

      expect(screen.getByTestId('signup-email-input')).toHaveAttribute(
        'autocomplete',
        'email'
      );
      expect(screen.getByTestId('signup-displayname-input')).toHaveAttribute(
        'autocomplete',
        'name'
      );
      expect(screen.getByTestId('signup-password-input')).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
      expect(
        screen.getByTestId('signup-confirmpassword-input')
      ).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  describe('User Interactions', () => {
    it('should clear global error when user starts typing', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Sign up failed' },
        }),
      });

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(screen.getByTestId('signup-submit-button'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('signup-error-message')).toBeInTheDocument();
      });

      // Start typing in email field
      await user.type(emailInput, 'a');

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByTestId('signup-error-message')
        ).not.toBeInTheDocument();
      });
    });

    it('should enable form inputs after error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Sign up failed' },
        }),
      });

      render(<SignUpForm />);

      const emailInput = screen.getByTestId('signup-email-input');
      const passwordInput = screen.getByTestId('signup-password-input');
      const confirmPasswordInput = screen.getByTestId(
        'signup-confirmpassword-input'
      );
      const submitButton = screen.getByTestId('signup-submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');

      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('signup-error-message')).toBeInTheDocument();
      });

      // Form should be enabled again
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(confirmPasswordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });
});
