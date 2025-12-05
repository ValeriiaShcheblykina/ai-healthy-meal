import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';
import { MetadataDisplay } from './MetadataDisplay';
import { DeleteVariantDialog } from './DeleteVariantDialog';
import type { RecipeVariantDTO } from '@/types';

interface VariantDetailViewProps {
  recipeId: string;
  variantId: string;
}

const recipesService = new RecipesClientService();

function VariantDetailViewInner({
  recipeId,
  variantId,
}: VariantDetailViewProps) {
  const [variant, setVariant] = React.useState<RecipeVariantDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { addToast } = useToast();

  // Fetch variant data
  React.useEffect(() => {
    const fetchVariant = async () => {
      try {
        setIsLoading(true);
        const data = await recipesService.getRecipeVariant(recipeId, variantId);
        setVariant(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load variant';
        setError(errorMessage);
        addToast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, [recipeId, variantId, addToast]);

  const handleBackToRecipe = () => {
    window.location.href = `/recipes/${recipeId}`;
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!variant) return;

    try {
      setIsDeleting(true);
      await recipesService.deleteRecipeVariant(recipeId, variantId);

      addToast({
        title: 'Success',
        description: 'Variant deleted successfully',
        variant: 'default',
      });

      // Redirect to recipe detail page after deletion
      setTimeout(() => {
        window.location.href = `/recipes/${recipeId}`;
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete variant';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          <div className="bg-muted h-10 w-24 animate-pulse rounded" />
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
  if (error || !variant) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBackToRecipe}>
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
          Back to Recipe
        </Button>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {error || 'Variant not found'}
          </p>
        </Card>
      </div>
    );
  }

  // Extract title from output_text or output_json
  let variantTitle = 'Recipe Variant';
  let variantContent = '';

  if (variant.output_text) {
    variantContent = variant.output_text;
    // Try to extract title from the first line
    const lines = variant.output_text.split('\n');
    if (lines[0] && lines[0].toLowerCase().startsWith('title:')) {
      variantTitle = lines[0].replace(/^title:\s*/i, '').trim();
    }
  } else if (variant.output_json) {
    const json = variant.output_json as Record<string, unknown>;
    if (json.title && typeof json.title === 'string') {
      variantTitle = json.title;
    }
    if (json.description && typeof json.description === 'string') {
      variantContent += `${json.description}\n\n`;
    }
    if (json.ingredients && Array.isArray(json.ingredients)) {
      variantContent += 'Ingredients:\n';
      variantContent += json.ingredients
        .map((ing: unknown) => {
          if (typeof ing === 'object' && ing !== null) {
            const ingObj = ing as { name?: string; quantity?: string };
            return `- ${ingObj.quantity || ''} ${ingObj.name || ''}`.trim();
          }
          return String(ing);
        })
        .join('\n');
      variantContent += '\n\n';
    }
    if (json.instructions && Array.isArray(json.instructions)) {
      variantContent += 'Instructions:\n';
      variantContent += json.instructions
        .map((step: unknown, i: number) => `${i + 1}. ${String(step)}`)
        .join('\n');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBackToRecipe}>
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
          Back to Recipe
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          data-testid="delete-variant-button"
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
          Delete Variant
        </Button>
      </div>

      {/* Variant content */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{variantTitle}</h1>
            <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
              <time dateTime={variant.created_at}>
                Created:{' '}
                {new Date(variant.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>
          <hr />
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{variantContent}</div>
          </div>
        </div>
      </Card>

      {/* Metadata */}
      <MetadataDisplay variant={variant} />

      {/* Delete confirmation dialog */}
      <DeleteVariantDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        variantTitle={variantTitle}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export function VariantDetailView({
  recipeId,
  variantId,
}: VariantDetailViewProps) {
  return (
    <ToastProvider>
      <VariantDetailViewInner recipeId={recipeId} variantId={variantId} />
    </ToastProvider>
  );
}
