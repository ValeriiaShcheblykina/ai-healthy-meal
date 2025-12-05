import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';
import { DeleteVariantDialog } from './DeleteVariantDialog';
import type { RecipeVariantDTO } from '@/types';

interface VariantListProps {
  recipeId: string;
  refreshKey?: number | string;
  onVariantDeleted?: () => void;
}

const recipesService = new RecipesClientService();

function VariantListInner({
  recipeId,
  refreshKey,
  onVariantDeleted,
}: VariantListProps) {
  const [variants, setVariants] = React.useState<RecipeVariantDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [variantToDelete, setVariantToDelete] =
    React.useState<RecipeVariantDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { addToast } = useToast();

  React.useEffect(() => {
    const fetchVariants = async () => {
      try {
        setIsLoading(true);
        const response = await recipesService.listRecipeVariants(recipeId, {
          page: 1,
          limit: 50,
          sort: 'created_at',
          order: 'desc',
        });
        setVariants(response.data);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load variants';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariants();
  }, [recipeId, refreshKey]);

  const handleDeleteClick = (
    e: React.MouseEvent,
    variant: RecipeVariantDTO
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setVariantToDelete(variant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!variantToDelete) return;

    try {
      setIsDeleting(true);
      await recipesService.deleteRecipeVariant(recipeId, variantToDelete.id);

      addToast({
        title: 'Success',
        description: 'Variant deleted successfully',
        variant: 'default',
      });

      // Refresh the list
      const response = await recipesService.listRecipeVariants(recipeId, {
        page: 1,
        limit: 50,
        sort: 'created_at',
        order: 'desc',
      });
      setVariants(response.data);

      // Notify parent if callback provided
      if (onVariantDeleted) {
        onVariantDeleted();
      }

      setDeleteDialogOpen(false);
      setVariantToDelete(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete variant';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getVariantTitle = (variant: RecipeVariantDTO): string => {
    if (variant.output_json) {
      const json = variant.output_json as Record<string, unknown>;
      if (json.title && typeof json.title === 'string') {
        return json.title;
      }
    }
    if (variant.output_text) {
      const lines = variant.output_text.split('\n');
      if (lines[0] && lines[0].toLowerCase().startsWith('title:')) {
        return lines[0].replace(/^title:\s*/i, '').trim();
      }
    }
    return 'Recipe Variant';
  };

  const getVariantIngredients = (variant: RecipeVariantDTO): string => {
    if (variant.output_json) {
      const json = variant.output_json as Record<string, unknown>;
      if (json.ingredients && Array.isArray(json.ingredients)) {
        return json.ingredients
          .map((ing: unknown) => {
            if (typeof ing === 'object' && ing !== null) {
              const ingObj = ing as { name?: string; quantity?: string };
              return `${ingObj.quantity || ''} ${ingObj.name || ''}`.trim();
            }
            return String(ing);
          })
          .join(', ');
      }
    }
    if (variant.output_text) {
      const lines = variant.output_text.split('\n');
      const ingredientsIndex = lines.findIndex((line) =>
        line.toLowerCase().includes('ingredients:')
      );
      if (ingredientsIndex !== -1 && lines[ingredientsIndex + 1]) {
        // Extract ingredients from the lines after "Ingredients:"
        const ingredientLines = lines
          .slice(ingredientsIndex + 1)
          .filter((line) => line.trim().startsWith('-'))
          .map((line) => line.replace(/^-\s*/, '').trim())
          .filter((line) => line.length > 0);
        return ingredientLines.join(', ');
      }
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Variants</h2>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-3 w-1/2 animate-pulse rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Variants</h2>
        <Card className="p-4">
          <p className="text-muted-foreground text-sm">{error}</p>
        </Card>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Variants</h2>
        <Card className="p-4">
          <p className="text-muted-foreground text-sm">
            No variants yet. Generate a variant to see it here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Variants ({variants.length})</h2>
      <div className="space-y-2">
        {variants.map((variant) => {
          const formattedDate = new Date(variant.created_at).toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          );

          const variantTitle = getVariantTitle(variant);
          const variantIngredients = getVariantIngredients(variant);

          return (
            <div
              key={variant.id}
              className="group relative rounded-xl transition-shadow hover:shadow-md"
            >
              <a
                href={`/recipes/${recipeId}/variants/${variant.id}`}
                className="focus-visible:ring-ring block rounded-xl transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label={`View variant ${variantTitle} created on ${formattedDate}`}
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="mb-1 text-base">
                          {variantTitle}
                        </CardTitle>
                        {variantIngredients && (
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            <span className="font-medium">Ingredients: </span>
                            {variantIngredients}
                          </p>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <time dateTime={variant.created_at}>
                        Created {formattedDate}
                      </time>
                      {variant.model && (
                        <span className="text-xs">Model: {variant.model}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => handleDeleteClick(e, variant)}
                aria-label={`Delete variant created on ${formattedDate}`}
                data-testid={`delete-variant-button-${variant.id}`}
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
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      {variantToDelete && (
        <DeleteVariantDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          variantTitle={getVariantTitle(variantToDelete)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

export function VariantList(props: VariantListProps) {
  return (
    <ToastProvider>
      <VariantListInner {...props} />
    </ToastProvider>
  );
}
