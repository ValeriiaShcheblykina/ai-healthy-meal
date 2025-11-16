import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/lib/validation/auth.validation';
import type { ZodError } from 'zod';

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<Partial<ForgotPasswordFormData>>({
    email: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormData, string>>
  >({});
  const [globalError, setGlobalError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof ForgotPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (globalError) {
      setGlobalError('');
    }
  };

  const handleBlur = (field: keyof ForgotPasswordFormData) => {
    // Validate single field on blur
    const result = forgotPasswordSchema.shape[field].safeParse(formData[field]);

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

    // Validate form
    try {
      const validatedData = forgotPasswordSchema.parse(formData);
      setIsLoading(true);

      // Call forgot password API
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalError(
          data.error?.message || 'Request failed. Please try again.'
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
          Record<keyof ForgotPasswordFormData, string>
        > = {};
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof ForgotPasswordFormData;
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
          data-testid="forgot-password-success-message"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
          role="status"
        >
          <h3 className="mb-1 font-semibold">Check your email</h3>
          <p className="text-sm">
            If an account exists with this email, you will receive password
            reset instructions.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <a href="/sign-in" data-testid="forgot-password-back-to-signin-link">
            Back to Sign In
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {globalError && (
        <div
          data-testid="forgot-password-error-message"
          className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3"
          role="alert"
        >
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          Enter your email address and we'll send you instructions to reset your
          password.
        </p>
      </div>

      <FormField label="Email" htmlFor="email" required error={errors.email}>
        <Input
          id="email"
          data-testid="forgot-password-email-input"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          aria-required="true"
        />
      </FormField>

      <div className="space-y-4">
        <Button
          type="submit"
          data-testid="forgot-password-submit-button"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Remember your password?{' '}
          <a
            href="/sign-in"
            data-testid="forgot-password-signin-link"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
}
