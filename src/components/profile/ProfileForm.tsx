import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/auth/FormField';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/lib/validation/auth.validation';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';
import { GenerateRecipeFromDietButton } from './GenerateRecipeFromDietButton';
import type { ZodError } from 'zod';
import type { DietType } from '@/types';

interface ProfileFormProps {
  initialData?: {
    displayName?: string | null;
    diets?: string[] | null;
    email?: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<UpdateProfileFormData>>({
    displayName: initialData?.displayName || '',
    diets: (initialData?.diets as DietType[]) || [],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateProfileFormData, string>>
  >({});
  const [globalError, setGlobalError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const profileService = new ProfileClientService();

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        displayName: initialData.displayName || '',
        diets: (initialData.diets as DietType[]) || [],
      });
    }
  }, [initialData]);

  const handleChange = (
    field: keyof UpdateProfileFormData,
    value: string | null | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (globalError) {
      setGlobalError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleDietToggle = (dietValue: DietType) => {
    const currentDiets = (formData.diets || []) as DietType[];
    const newDiets = currentDiets.includes(dietValue)
      ? currentDiets.filter((d) => d !== dietValue)
      : [...currentDiets, dietValue];
    handleChange('diets', newDiets);
  };

  const handleBlur = (field: keyof UpdateProfileFormData) => {
    // Validate single field on blur
    const fieldSchema = updateProfileSchema.shape[field];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(formData[field]);

      if (result.success) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } else {
        const fieldError = result.error.issues[0]?.message;
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setErrors({});
    setSuccessMessage('');

    // Validate form
    try {
      const validatedData = updateProfileSchema.parse(formData);
      setIsLoading(true);

      // Call profile update service
      const data = await profileService.updateProfile(validatedData);

      // Success
      setSuccessMessage('Profile updated successfully!');
      setIsLoading(false);

      // Update form data with response
      if (data.profile) {
        setFormData({
          displayName: data.profile.displayName || '',
          diets: (data.profile.diets as DietType[]) || [],
        });
      }
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError;
        const fieldErrors: Partial<
          Record<keyof UpdateProfileFormData, string>
        > = {};
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof UpdateProfileFormData;
          if (field) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const dietOptions: { value: DietType; label: string }[] = [
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
  ];

  const selectedDiets = (formData.diets || []) as DietType[];

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

      {successMessage && (
        <div
          className="rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-700 dark:text-green-400"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      <FormField label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          value={initialData?.email || ''}
          disabled
          className="bg-muted cursor-not-allowed"
          aria-label="Email address (read-only)"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Email cannot be changed
        </p>
      </FormField>

      <FormField
        label="Display Name"
        htmlFor="displayName"
        error={errors.displayName}
      >
        <Input
          id="displayName"
          name="displayName"
          type="text"
          value={formData.displayName || ''}
          onChange={(e) => handleChange('displayName', e.target.value)}
          onBlur={() => handleBlur('displayName')}
          placeholder="Your name (optional)"
          autoComplete="name"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Preferred Diet" htmlFor="diets" error={errors.diets}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {dietOptions.map((option) => {
            const isSelected = selectedDiets.includes(option.value);
            return (
              <label
                key={option.value}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-input bg-background hover:border-primary/50 hover:bg-accent/30'
                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''} focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2`}
              >
                <input
                  type="checkbox"
                  id={`diet-${option.value}`}
                  name="diets"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleDietToggle(option.value)}
                  onBlur={() => handleBlur('diets')}
                  disabled={isLoading}
                  className="sr-only"
                  aria-label={`Select ${option.label} diet`}
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg
                      className="text-primary h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                )}
                <span
                  className={`text-center text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
        {selectedDiets.length === 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            Select one or more dietary preferences
          </p>
        )}
        {selectedDiets.length > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            {selectedDiets.length} diet{selectedDiets.length !== 1 ? 's' : ''}{' '}
            selected
          </p>
        )}
      </FormField>

      {selectedDiets.length > 0 && (
        <div className="pt-2">
          <GenerateRecipeFromDietButton
            selectedDiets={selectedDiets}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
