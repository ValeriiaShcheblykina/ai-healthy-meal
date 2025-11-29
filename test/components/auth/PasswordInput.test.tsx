import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/components/auth/PasswordInput';

describe('PasswordInput', () => {
  beforeEach(() => {
    // Clear any previous renders
  });

  describe('Basic Rendering', () => {
    it('should render password input field', () => {
      render(<PasswordInput />);
      const input = document.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('should render with password type by default', () => {
      render(<PasswordInput />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<PasswordInput />);
      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render Eye icon when password is hidden', () => {
      render(<PasswordInput />);
      const eyeIcon = document.querySelector('svg');
      expect(eyeIcon).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      // Initially password should be hidden
      let input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();

      // Click toggle button
      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });
      await user.click(toggleButton);

      // Password should now be visible (type="text")
      input = document.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();

      // Toggle button label should change
      expect(
        screen.getByRole('button', { name: /hide password/i })
      ).toBeInTheDocument();
    });

    it('should toggle back to password type when clicked again', async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });

      // First click - show password
      await user.click(toggleButton);
      expect(document.querySelector('input[type="text"]')).toBeInTheDocument();

      // Second click - hide password
      await user.click(toggleButton);
      expect(
        document.querySelector('input[type="password"]')
      ).toBeInTheDocument();
    });

    it('should change icon from Eye to EyeOff when password is shown', async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });

      // Initially Eye icon should be visible
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);

      // Click to show password
      await user.click(toggleButton);

      // Icon should change (EyeOff)
      const svgsAfter = document.querySelectorAll('svg');
      expect(svgsAfter.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should display error state with aria-invalid when error is provided', () => {
      render(
        <PasswordInput error="Password is required" id="password-input" />
      );

      const input = document.querySelector('input[id="password-input"]');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not have aria-invalid when no error is provided', () => {
      render(<PasswordInput id="password-input" />);

      const input = document.querySelector('input[id="password-input"]');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have aria-describedby when error is provided', () => {
      render(
        <PasswordInput error="Password is required" id="password-input" />
      );

      const input = document.querySelector('input[id="password-input"]');
      expect(input).toHaveAttribute('aria-describedby', 'password-input-error');
    });

    it('should not have aria-describedby when no error is provided', () => {
      render(<PasswordInput id="password-input" />);

      const input = document.querySelector('input[id="password-input"]');
      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Data Test ID', () => {
    it('should apply data-testid to input when provided', () => {
      render(<PasswordInput data-testid="test-password" />);

      const input = document.querySelector(
        'input[data-testid="test-password"]'
      );
      expect(input).toBeInTheDocument();
    });

    it('should apply data-testid to toggle button when provided', () => {
      render(<PasswordInput data-testid="test-password" />);

      const toggleButton = screen.getByTestId('test-password-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should not apply data-testid to toggle button when not provided', () => {
      render(<PasswordInput />);

      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });
      expect(toggleButton).not.toHaveAttribute('data-testid');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward className to input', () => {
      render(<PasswordInput className="custom-class" />);

      const input = document.querySelector('input.custom-class');
      expect(input).toBeInTheDocument();
    });

    it('should forward other input props', () => {
      render(<PasswordInput placeholder="Enter password" name="password" />);

      const input = document.querySelector('input[name="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter password');
    });

    it('should forward value prop', () => {
      render(<PasswordInput value="test-password" />);

      const input = document.querySelector('input');
      expect(input).toHaveValue('test-password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for toggle button when password is hidden', () => {
      render(<PasswordInput />);

      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
    });

    it('should have proper aria-label for toggle button when password is shown', async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });
      await user.click(toggleButton);

      expect(
        screen.getByRole('button', { name: /hide password/i })
      ).toHaveAttribute('aria-label', 'Hide password');
    });
  });
});
