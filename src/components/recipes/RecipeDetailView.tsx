import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DeleteRecipeDialog } from './DeleteRecipeDialog';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';
import type { RecipeListItemDTO } from '@/types';

interface RecipeDetailViewProps {
  recipeId: string;
}

const recipesService = new RecipesClientService();

function RecipeDetailViewInner({ recipeId }: RecipeDetailViewProps) {
  const [recipe, setRecipe] = React.useState<RecipeListItemDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { addToast } = useToast();

  // Fetch recipe data
  React.useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setIsLoading(true);
        const data = await recipesService.getRecipe(recipeId);
        setRecipe(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load recipe';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await recipesService.deleteRecipe(recipeId);

      addToast({
        title: 'Success',
        description: 'Recipe deleted successfully',
        variant: 'default',
      });

      // Redirect to recipes list after deletion
      setTimeout(() => {
        window.location.href = '/recipes';
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete recipe';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = () => {
    window.location.href = `/recipes/${recipeId}/edit`;
  };

  const handleBackToList = () => {
    window.location.href = '/recipes';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="bg-muted h-10 w-20 animate-pulse rounded" />
            <div className="bg-muted h-10 w-20 animate-pulse rounded" />
          </div>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="bg-muted h-8 w-3/4 animate-pulse rounded" />
            <div className="space-y-2">
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBackToList}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to Recipes
        </Button>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{error || 'Recipe not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToList}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Recipes
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              data-testid="recipe-edit-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                <path d="m15 5 4 4" />
              </svg>
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              data-testid="recipe-delete-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        {/* Recipe content */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{recipe.title}</h1>
              <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
                <time dateTime={recipe.created_at}>
                  Created: {new Date(recipe.created_at).toLocaleDateString()}
                </time>
                <time dateTime={recipe.updated_at}>
                  Updated: {new Date(recipe.updated_at).toLocaleDateString()}
                </time>
              </div>
            </div>
            <hr />
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{recipe.content}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteRecipeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        recipeName={recipe.title}
        isDeleting={isDeleting}
      />
    </>
  );
}

export function RecipeDetailView({ recipeId }: RecipeDetailViewProps) {
  return (
    <ToastProvider>
      <RecipeDetailViewInner recipeId={recipeId} />
    </ToastProvider>
  );
}
