import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '@/components/auth/FormField';
import { Input } from '@/components/ui/input';

describe('FormField', () => {
  describe('Basic Rendering', () => {
    it('should render label and children', () => {
      render(
        <FormField label="Test Label" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toHaveAttribute(
        'id',
        'test-input'
      );
    });

    it('should render required indicator when required prop is true', () => {
      render(
        <FormField label="Required Field" htmlFor="test-input" required>
          <Input id="test-input" />
        </FormField>
      );

      const label = screen.getByText('Required Field');
      expect(label).toBeInTheDocument();
      // Check for required asterisk
      const asterisk = label.parentElement?.querySelector('.text-destructive');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveTextContent('*');
    });

    it('should not render required indicator when required prop is false', () => {
      render(
        <FormField label="Optional Field" htmlFor="test-input" required={false}>
          <Input id="test-input" />
        </FormField>
      );

      const label = screen.getByLabelText('Optional Field');
      expect(label).toBeInTheDocument();
      const asterisk = label.parentElement?.querySelector('.text-destructive');
      expect(asterisk).not.toBeInTheDocument();
    });

    it('should not render required indicator when required prop is undefined', () => {
      render(
        <FormField label="Optional Field" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );

      const label = screen.getByLabelText('Optional Field');
      expect(label).toBeInTheDocument();
      const asterisk = label.parentElement?.querySelector('.text-destructive');
      expect(asterisk).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error prop is provided', () => {
      render(
        <FormField
          label="Test Field"
          htmlFor="test-input"
          error="This field is required"
        >
          <Input id="test-input" />
        </FormField>
      );

      const errorMessage = screen.getByText('This field is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      expect(errorMessage).toHaveAttribute('id', 'test-input-error');
    });

    it('should not display error message when error prop is not provided', () => {
      render(
        <FormField label="Test Field" htmlFor="test-input">
          <Input id="test-input" />
        </FormField>
      );

      const errorMessage = screen.queryByRole('alert');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display error message when error prop is empty string', () => {
      render(
        <FormField label="Test Field" htmlFor="test-input" error="">
          <Input id="test-input" />
        </FormField>
      );

      const errorMessage = screen.queryByRole('alert');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should have correct error message ID based on htmlFor', () => {
      render(
        <FormField label="Email" htmlFor="email-field" error="Invalid email">
          <Input id="email-field" />
        </FormField>
      );

      const errorMessage = screen.getByText('Invalid email');
      expect(errorMessage).toHaveAttribute('id', 'email-field-error');
    });
  });

  describe('Accessibility', () => {
    it('should associate label with input using htmlFor', () => {
      render(
        <FormField label="Email Address" htmlFor="email-input">
          <Input id="email-input" />
        </FormField>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('should have proper error message accessibility attributes', () => {
      render(
        <FormField
          label="Password"
          htmlFor="password-input"
          error="Password must be at least 8 characters"
        >
          <Input id="password-input" type="password" />
        </FormField>
      );

      const errorMessage = screen.getByText(
        'Password must be at least 8 characters'
      );
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes to error message', () => {
      render(
        <FormField
          label="Test Field"
          htmlFor="test-input"
          error="Error message"
        >
          <Input id="test-input" />
        </FormField>
      );

      const errorMessage = screen.getByText('Error message');
      expect(errorMessage).toHaveClass('text-destructive', 'mt-2', 'text-sm');
    });

    it('should apply correct CSS classes to required asterisk', () => {
      render(
        <FormField label="Required Field" htmlFor="test-input" required>
          <Input id="test-input" />
        </FormField>
      );

      const label = screen.getByText('Required Field');
      const asterisk = label.parentElement?.querySelector('.text-destructive');
      expect(asterisk).toHaveClass('text-destructive', 'ml-1');
    });
  });

  describe('Children Rendering', () => {
    it('should render any React children', () => {
      render(
        <FormField label="Custom Field" htmlFor="custom-input">
          <div>
            <Input id="custom-input" />
            <span>Helper text</span>
          </div>
        </FormField>
      );

      expect(screen.getByLabelText('Custom Field')).toBeInTheDocument();
      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <FormField label="Multi Field" htmlFor="multi-input">
          <Input id="multi-input" />
          <button type="button">Action</button>
        </FormField>
      );

      expect(screen.getByLabelText('Multi Field')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Action' })
      ).toBeInTheDocument();
    });
  });
});
