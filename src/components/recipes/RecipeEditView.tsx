import * as React from 'react';
import { Card } from '@/components/ui/card';
import { RecipeForm, type RecipeFormData } from './RecipeForm';
import { ToastProvider, useToast } from '@/components/ui/toast';
import type { RecipeListItemDTO } from '@/types';

interface RecipeEditViewProps {
  recipeId: string;
}

function RecipeEditViewInner({ recipeId }: RecipeEditViewProps) {
  const [recipe, setRecipe] = React.useState<RecipeListItemDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch recipe data
  React.useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recipes/${recipeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Recipe not found');
          } else if (response.status === 401) {
            window.location.href = '/';
          } else {
            setError('Failed to load recipe');
          }
          return;
        }

        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        setError('Failed to load recipe');
        console.error('Error fetching recipe:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  const handleSubmit = async (data: RecipeFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update recipe');
      }

      addToast({
        title: 'Success',
        description: 'Recipe updated successfully',
        variant: 'default',
      });

      // Redirect to recipe detail page
      setTimeout(() => {
        window.location.href = `/recipes/${recipeId}`;
      }, 500);
    } catch (error) {
      console.error('Error updating recipe:', error);
      addToast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update recipe',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.location.href = `/recipes/${recipeId}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="bg-muted h-9 w-48 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-5 w-64 animate-pulse rounded" />
        </div>
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="bg-muted h-5 w-20 animate-pulse rounded" />
              <div className="bg-muted h-10 w-full animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="bg-muted h-5 w-32 animate-pulse rounded" />
              <div className="bg-muted h-64 w-full animate-pulse rounded" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Recipe</h1>
        </div>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{error || 'Recipe not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Recipe</h1>
        <p className="text-muted-foreground mt-2">Update your recipe details</p>
      </div>

      <Card className="p-6">
        <RecipeForm
          initialData={recipe}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </Card>
    </div>
  );
}

export function RecipeEditView({ recipeId }: RecipeEditViewProps) {
  return (
    <ToastProvider>
      <RecipeEditViewInner recipeId={recipeId} />
    </ToastProvider>
  );
}
