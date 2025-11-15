import { z } from 'zod';

// Password validation: min 8 chars, at least one number, one uppercase, one lowercase
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter');

// Email validation
const emailSchema = z.string().email('Please enter a valid email address');

// Sign up payload validation (client-side)
const signUpBaseSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  displayName: z
    .string()
    .max(100, 'Display name must be less than 100 characters')
    .optional(),
});

export const signUpSchema = signUpBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Export base schema for individual field validation
export const signUpFieldSchema = signUpBaseSchema;

// Sign in payload validation (client-side)
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Forgot password payload validation
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password payload validation
const resetPasswordBaseSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
});

export const resetPasswordSchema = resetPasswordBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Export base schema for individual field validation
export const resetPasswordFieldSchema = resetPasswordBaseSchema;

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
