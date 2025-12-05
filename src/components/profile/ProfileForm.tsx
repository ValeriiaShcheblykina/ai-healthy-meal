import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/ui/tag-input';
import { FormField } from '@/components/auth/FormField';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/lib/validation/auth.validation';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';
import { GenerateRecipeFromPreferences } from '@/components/GenerateRecipeFromPreferences';
import type { ZodError } from 'zod';
import type { DietType } from '@/types';

interface ProfileFormProps {
  initialData?: {
    displayName?: string | null;
    diets?: string[] | null;
    allergens?: string[] | null;
    dislikedIngredients?: string[] | null;
    calorieTarget?: number | null;
    email?: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<UpdateProfileFormData>>({
    displayName: initialData?.displayName || '',
    diets: (initialData?.diets as DietType[]) || [],
    allergens: Array.isArray(initialData?.allergens)
      ? initialData.allergens
      : [],
    dislikedIngredients: Array.isArray(initialData?.dislikedIngredients)
      ? initialData.dislikedIngredients
      : [],
    calorieTarget: initialData?.calorieTarget || null,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateProfileFormData, string>>
  >({});
  const [globalError, setGlobalError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const profileService = new ProfileClientService();
  // Use ref to always have access to latest formData in async handlers
  const formDataRef = useRef(formData);

  // Keep ref in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        displayName: initialData.displayName || '',
        diets: (initialData.diets as DietType[]) || [],
        allergens: Array.isArray(initialData.allergens)
          ? initialData.allergens
          : [],
        dislikedIngredients: Array.isArray(initialData.dislikedIngredients)
          ? initialData.dislikedIngredients
          : [],
        calorieTarget: initialData.calorieTarget || null,
      });
    }
  }, [initialData]);

  const handleChange = (
    field: keyof UpdateProfileFormData,
    value: string | null | string[] | number
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
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
      // Use ref to get the latest formData (avoids closure issues)
      const currentFormData = formDataRef.current;

      // Prepare data for validation - ensure arrays are properly formatted
      const dataToValidate = {
        ...currentFormData,
        // Ensure allergens and dislikedIngredients are arrays if they exist
        allergens:
          currentFormData.allergens !== undefined
            ? Array.isArray(currentFormData.allergens)
              ? currentFormData.allergens
              : null
            : undefined,
        dislikedIngredients:
          currentFormData.dislikedIngredients !== undefined
            ? Array.isArray(currentFormData.dislikedIngredients)
              ? currentFormData.dislikedIngredients
              : null
            : undefined,
      };

      const validatedData = updateProfileSchema.parse(dataToValidate);

      // Build the final payload - always include allergens and dislikedIngredients
      // Use the actual values from currentFormData to ensure we send what the user actually entered
      const dataToSend = {
        displayName: validatedData.displayName ?? null,
        diets: validatedData.diets ?? null,
        // Use currentFormData values directly - if they're arrays, send them; if undefined, send null
        allergens: Array.isArray(currentFormData.allergens)
          ? currentFormData.allergens
          : null,
        dislikedIngredients: Array.isArray(currentFormData.dislikedIngredients)
          ? currentFormData.dislikedIngredients
          : null,
        calorieTarget: validatedData.calorieTarget ?? null,
      };

      setIsLoading(true);

      // Call profile update service
      const data = await profileService.updateProfile(dataToSend);

      // Success
      setSuccessMessage('Profile updated successfully!');
      setIsLoading(false);

      // Update form data with response
      if (data.profile) {
        setFormData({
          displayName: data.profile.displayName || '',
          diets: (data.profile.diets as DietType[]) || [],
          allergens: data.profile.allergens || [],
          dislikedIngredients: data.profile.dislikedIngredients || [],
          calorieTarget: data.profile.calorieTarget || null,
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

      <div className="pt-2">
        <p className="text-muted-foreground mb-2 text-xs sm:text-sm">
          Generate a recipe using all your profile preferences (diets,
          allergens, disliked ingredients, and calorie target)
        </p>
        <div className="w-full">
          <GenerateRecipeFromPreferences
            disabled={isLoading}
            className="w-full"
          />
        </div>
      </div>

      <FormField label="Allergens" htmlFor="allergens" error={errors.allergens}>
        <TagInput
          tags={Array.isArray(formData.allergens) ? formData.allergens : []}
          onTagsChange={(tags) => {
            handleChange('allergens', tags);
          }}
          placeholder="e.g., peanuts, shellfish, dairy"
          disabled={isLoading}
          label=""
          error={errors.allergens}
          aria-label="Allergens to avoid"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          These allergens will be excluded from AI-generated recipes
        </p>
      </FormField>

      <FormField
        label="Disliked Ingredients"
        htmlFor="dislikedIngredients"
        error={errors.dislikedIngredients}
      >
        <TagInput
          tags={
            Array.isArray(formData.dislikedIngredients)
              ? formData.dislikedIngredients
              : []
          }
          onTagsChange={(tags) => {
            handleChange('dislikedIngredients', tags);
          }}
          placeholder="e.g., cilantro, mushrooms, onions"
          disabled={isLoading}
          label=""
          error={errors.dislikedIngredients}
          aria-label="Disliked ingredients to avoid"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          These ingredients will be excluded from AI-generated recipes
        </p>
      </FormField>

      <FormField
        label="Calorie Target"
        htmlFor="calorieTarget"
        error={errors.calorieTarget}
      >
        <Input
          id="calorieTarget"
          name="calorieTarget"
          type="number"
          min="0"
          max="10000"
          step="50"
          value={formData.calorieTarget || ''}
          onChange={(e) => {
            const value = e.target.value;
            handleChange(
              'calorieTarget',
              value === '' ? null : parseInt(value, 10)
            );
          }}
          onBlur={() => handleBlur('calorieTarget')}
          placeholder="e.g., 2000"
          disabled={isLoading}
          aria-label="Target calories per serving"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Target calories per serving for AI-generated recipes (optional)
        </p>
      </FormField>

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
