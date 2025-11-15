import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import { PasswordInput } from './PasswordInput';
import {
  signUpSchema,
  signUpFieldSchema,
  type SignUpFormData,
} from '@/lib/validation/auth.validation';
import type { ZodError } from 'zod';

export function SignUpForm() {
  const [formData, setFormData] = useState<Partial<SignUpFormData>>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpFormData, string>>
  >({});
  const [globalError, setGlobalError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    field: keyof SignUpFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (globalError) {
      setGlobalError('');
    }
  };

  const handleBlur = (field: keyof SignUpFormData) => {
    // Validate single field on blur
    const result = signUpFieldSchema.shape[field].safeParse(formData[field]);

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
      const validatedData = signUpSchema.parse(formData);
      setIsLoading(true);

      // Call sign-up API
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalError(
          data.error?.message || 'Sign up failed. Please try again.'
        );
        setIsLoading(false);
        return;
      }

      // Redirect to recipes page (email verification disabled per requirements)
      window.location.href = '/recipes';
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError;
        const fieldErrors: Partial<Record<keyof SignUpFormData, string>> = {};
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof SignUpFormData;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {globalError && (
        <div
          className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3"
          role="alert"
        >
          {globalError}
        </div>
      )}

      <FormField label="Email" htmlFor="email" required error={errors.email}>
        <Input
          id="email"
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

      <FormField
        label="Display Name"
        htmlFor="displayName"
        error={errors.displayName}
      >
        <Input
          id="displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          onBlur={() => handleBlur('displayName')}
          placeholder="Your name (optional)"
          autoComplete="name"
          disabled={isLoading}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        required
        error={errors.password}
      >
        <PasswordInput
          id="password"
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
        label="Confirm Password"
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword}
      >
        <PasswordInput
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={isLoading}
          aria-required="true"
        />
      </FormField>

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{' '}
          <a
            href="/sign-in"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
}
