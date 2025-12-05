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

// Profile update validation
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .max(100, 'Display name must be less than 100 characters')
    .optional()
    .nullable(),
  diets: z
    .array(
      z.enum([
        'none',
        'vegan',
        'vegetarian',
        'pescatarian',
        'keto',
        'paleo',
        'halal',
        'kosher',
      ])
    )
    .optional()
    .nullable(),
  allergens: z
    .array(
      z
        .string()
        .min(1, 'Allergen cannot be empty')
        .max(100, 'Allergen name too long')
    )
    .optional()
    .nullable(),
  dislikedIngredients: z
    .array(
      z
        .string()
        .min(1, 'Ingredient cannot be empty')
        .max(100, 'Ingredient name too long')
    )
    .optional()
    .nullable(),
  calorieTarget: z
    .number()
    .int('Calorie target must be a whole number')
    .min(0, 'Calorie target must be positive')
    .max(10000, 'Calorie target must be less than 10000')
    .optional()
    .nullable(),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
