import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { PasswordInput } from './PasswordInput';
import {
  resetPasswordSchema,
  resetPasswordFieldSchema,
  type ResetPasswordFormData,
} from '@/lib/validation/auth.validation';
import type { ZodError } from 'zod';

export interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<Partial<ResetPasswordFormData>>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ResetPasswordFormData, string>>
  >({});
  const [globalError, setGlobalError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (globalError) {
      setGlobalError('');
    }
  };

  const handleBlur = (field: keyof ResetPasswordFormData) => {
    // Validate single field on blur
    const result = resetPasswordFieldSchema.shape[field].safeParse(
      formData[field]
    );

    if (result.success) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } else {
      const fieldError = result.error.issues[0]?.message;
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setErrors({});

    if (!token) {
      setGlobalError(
        'Invalid or missing reset token. Please request a new password reset link.'
      );
      return;
    }

    // Validate form
    try {
      const validatedData = resetPasswordSchema.parse(formData);
      setIsLoading(true);

      // Call reset password API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalError(
          data.error?.message || 'Password reset failed. Please try again.'
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError;
        const fieldErrors: Partial<
          Record<keyof ResetPasswordFormData, string>
        > = {};
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof ResetPasswordFormData;
          if (field) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setGlobalError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div
          data-testid="reset-password-success-message"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
          role="status"
        >
          <h3 className="mb-1 font-semibold">Password reset successful</h3>
          <p className="text-sm">
            Your password has been successfully reset. You can now sign in with
            your new password.
          </p>
        </div>

        <Button asChild className="w-full">
          <a href="/sign-in" data-testid="reset-password-signin-link">
            Continue to Sign In
          </a>
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <div
          className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3"
          role="alert"
        >
          <h3 className="mb-1 font-semibold">Invalid reset link</h3>
          <p className="text-sm">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <a href="/forgot-password">Request New Reset Link</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {globalError && (
        <div
          data-testid="reset-password-error-message"
          className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3"
          role="alert"
        >
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          Enter your new password below. Make sure it&apos;s strong and secure.
        </p>
      </div>

      <FormField
        label="New Password"
        htmlFor="password"
        required
        error={errors.password}
      >
        <PasswordInput
          id="password"
          name="password"
          data-testid="reset-password-password-input"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="Enter a strong password"
          autoComplete="new-password"
          disabled={isLoading}
          aria-required="true"
        />
      </FormField>

      <FormField
        label="Confirm New Password"
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          data-testid="reset-password-confirmpassword-input"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={isLoading}
          aria-required="true"
        />
      </FormField>

      <Button
        type="submit"
        data-testid="reset-password-submit-button"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Resetting password...' : 'Reset Password'}
      </Button>
    </form>
  );
}
