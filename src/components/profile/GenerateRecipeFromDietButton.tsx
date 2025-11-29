import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';
import type { DietType } from '@/types';

export interface GenerateRecipeFromDietButtonProps {
  selectedDiets: DietType[];
  disabled?: boolean;
}

const profileService = new ProfileClientService();

export function GenerateRecipeFromDietButton({
  selectedDiets,
  disabled = false,
}: GenerateRecipeFromDietButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate recipe using service method
      // Navigate to recipe creation page with generated data
      window.location.href =
        await profileService.generateRecipeFromDiets(selectedDiets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full">
      <Button
        onClick={handleGenerate}
        disabled={disabled || isGenerating || selectedDiets.length === 0}
        variant="default"
        className="w-full gap-2"
        size="default"
        data-testid="generate-recipe-from-diet-button"
        aria-label="Generate recipe based on your selected dietary preferences"
      >
        <Sparkles
          className={`h-4 w-4 flex-shrink-0 ${isGenerating ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span>
          {isGenerating
            ? 'Generating Recipe...'
            : 'Generate Recipe from My Diet Preferences'}
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
      {selectedDiets.length === 0 && (
        <p className="text-muted-foreground mt-2 text-xs">
          Select at least one dietary preference to generate a recipe
        </p>
      )}
    </div>
  );
}
