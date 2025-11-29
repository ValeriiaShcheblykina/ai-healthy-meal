import * as React from 'react';
import { Card } from '@/components/ui/card';
import { RecipeForm, type RecipeFormData } from './RecipeForm';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';

const recipesService = new RecipesClientService();

function RecipeCreateViewInner() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { addToast } = useToast();

  // Parse generated recipe data from URL parameters
  const getInitialData = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    if (!params.get('generated')) {
      return undefined;
    }

    try {
      const title = params.get('title') || '';
      const description = params.get('description') || '';
      const ingredientsParam = params.get('ingredients');
      const instructionsParam = params.get('instructions');
      const prepTime = params.get('prep_time');
      const cookTime = params.get('cook_time');
      const servings = params.get('servings');

      let content = '';
      if (description) {
        content += `${description}\n\n`;
      }

      if (ingredientsParam) {
        const ingredients = JSON.parse(ingredientsParam);
        if (Array.isArray(ingredients)) {
          content += 'Ingredients:\n';
          ingredients.forEach((ing: unknown) => {
            if (typeof ing === 'string') {
              content += `- ${ing}\n`;
            } else if (
              ing &&
              typeof ing === 'object' &&
              'name' in ing &&
              'quantity' in ing
            ) {
              content += `- ${(ing as { quantity: string }).quantity} ${(ing as { name: string }).name}\n`;
            }
          });
          content += '\n';
        }
      }

      if (instructionsParam) {
        const instructions = JSON.parse(instructionsParam);
        if (Array.isArray(instructions)) {
          content += 'Instructions:\n';
          instructions.forEach((instruction: unknown, index: number) => {
            if (typeof instruction === 'string') {
              content += `${index + 1}. ${instruction}\n`;
            }
          });
        }
      }

      const initialData: Partial<RecipeFormData> = {
        title,
        content: content.trim() || undefined,
      };

      // Add optional fields if present
      if (prepTime) {
        initialData.prep_time = parseInt(prepTime, 10);
      }
      if (cookTime) {
        initialData.cook_time = parseInt(cookTime, 10);
      }
      if (servings) {
        initialData.servings = parseInt(servings, 10);
      }

      return initialData;
    } catch (error) {
      console.error('Error parsing generated recipe data:', error);
      return undefined;
    }
  }, []);

  const handleSubmit = async (data: RecipeFormData) => {
    try {
      setIsSubmitting(true);

      const newRecipe = await recipesService.createRecipe(data);

      addToast({
        title: 'Success',
        description: 'Recipe created successfully',
        variant: 'default',
      });

      // Redirect to the new recipe
      setTimeout(() => {
        window.location.href = `/recipes/${newRecipe.id}`;
      }, 500);
    } catch (error) {
      addToast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create recipe',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/recipes';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Recipe</h1>
        <p className="text-muted-foreground mt-2">
          {getInitialData
            ? 'Review and edit your AI-generated recipe'
            : 'Add a new recipe to your collection'}
        </p>
        {getInitialData && (
          <div className="bg-primary/10 text-primary mt-2 rounded-md p-3 text-sm">
            This recipe was generated based on your existing recipes and
            preferences. Please review and make any adjustments before saving.
          </div>
        )}
      </div>

      <Card className="p-6">
        <RecipeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          initialData={getInitialData}
        />
      </Card>
    </div>
  );
}

export function RecipeCreateView() {
  return (
    <ToastProvider>
      <RecipeCreateViewInner />
    </ToastProvider>
  );
}
