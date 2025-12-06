import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';

export interface GenerateRecipeFromPreferencesProps {
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const profileService = new ProfileClientService();

export function GenerateRecipeFromPreferences({
  disabled = false,
  variant = 'secondary',
  size = 'default',
  className = '',
}: GenerateRecipeFromPreferencesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);

  // Check if user has preferences set
  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const userData = await profileService.getCurrentUser();
        const profile = userData.user.profile;

        if (profile) {
          const hasDiets = profile.diets && profile.diets.length > 0;
          const hasAllergens =
            profile.allergens && profile.allergens.length > 0;
          const hasDislikedIngredients =
            profile.dislikedIngredients &&
            profile.dislikedIngredients.length > 0;
          const hasCalorieTarget =
            profile.calorieTarget !== null &&
            profile.calorieTarget !== undefined;

          setHasPreferences(
            hasDiets ||
              hasAllergens ||
              hasDislikedIngredients ||
              hasCalorieTarget
          );
        } else {
          setHasPreferences(false);
        }
      } catch {
        setHasPreferences(false);
      }
    };

    checkPreferences();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate recipe using all user preferences from profile
      window.location.href =
        await profileService.generateRecipeFromPreferences();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  // Don't render if we know user has no preferences
  if (hasPreferences === false) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        onClick={handleGenerate}
        disabled={disabled || isGenerating || hasPreferences !== true}
        variant={variant}
        size={size}
        className={`ai-generation-button-secondary gap-2 ${className}`}
        data-testid="generate-recipe-from-preferences-button"
        aria-label="Generate recipe based on your profile preferences"
      >
        <Sparkles
          className={`h-4 w-4 flex-shrink-0 ${isGenerating ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">
          {isGenerating
            ? 'Generating...'
            : 'Generate Recipe from My Preferences'}
        </span>
        <span className="sm:hidden">
          {isGenerating ? 'Generating...' : 'Generate Recipe'}
        </span>
      </Button>
      {error && (
        <div
          className="border-destructive/50 bg-destructive/10 text-destructive absolute top-full right-0 left-0 z-10 mt-2 rounded-md border p-2 text-xs shadow-sm sm:text-sm"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </div>
  );
}
