import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';

export interface GenerateRecipeButtonProps {
  disabled?: boolean;
}

const recipesService = new RecipesClientService();

export function GenerateRecipeButton({
  disabled = false,
}: GenerateRecipeButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generatedRecipe = await recipesService.aiGenerateRecipe();

      // Invalidate recipes query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });

      // Redirect to recipe creation page with generated data
      const params = new URLSearchParams();
      params.set('generated', 'true');
      params.set('title', (generatedRecipe.title as string) || '');
      if (generatedRecipe.description) {
        params.set('description', generatedRecipe.description as string);
      }
      if (generatedRecipe.ingredients) {
        params.set('ingredients', JSON.stringify(generatedRecipe.ingredients));
      }
      if (generatedRecipe.instructions) {
        params.set(
          'instructions',
          JSON.stringify(generatedRecipe.instructions)
        );
      }
      if (generatedRecipe.prep_time) {
        params.set('prep_time', generatedRecipe.prep_time.toString());
      }
      if (generatedRecipe.cook_time) {
        params.set('cook_time', generatedRecipe.cook_time.toString());
      }
      if (generatedRecipe.servings) {
        params.set('servings', generatedRecipe.servings.toString());
      }

      // Navigate to recipe creation page with generated data
      window.location.href = `/recipes/new?${params.toString()}`;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full sm:w-auto">
      <Button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        variant="secondary"
        className="w-full gap-1.5 sm:w-auto sm:gap-2"
        size="default"
        data-testid="generate-recipe-button"
        aria-label="Generate recipe based on your list and preferences"
      >
        <Sparkles
          className={`h-4 w-4 flex-shrink-0 shrink-0 ${isGenerating ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        {/* Full text for large screens */}
        <span className="hidden whitespace-nowrap xl:inline">
          {isGenerating ? 'Generating...' : 'AI Generate Recipe'}
        </span>
        {/* Medium text for medium-large screens */}
        <span className="hidden whitespace-nowrap md:inline xl:hidden">
          {isGenerating ? 'Generating...' : 'AI Generate Recipe'}
        </span>
        {/* Short text for small-medium screens */}
        <span className="hidden whitespace-nowrap sm:inline md:hidden">
          {isGenerating ? 'Generating...' : 'AI Generate Recipe'}
        </span>
        {/* Very short text for mobile */}
        <span className="whitespace-nowrap sm:hidden">
          {isGenerating ? 'Generating...' : 'AI Generate'}
        </span>
      </Button>
      {error && (
        <div
          className="border-destructive/50 bg-destructive/10 text-destructive absolute top-full right-0 left-0 z-10 mt-2 rounded-md border p-2 text-xs shadow-sm sm:right-0 sm:left-auto sm:w-max sm:max-w-md sm:text-sm"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </div>
  );
}
