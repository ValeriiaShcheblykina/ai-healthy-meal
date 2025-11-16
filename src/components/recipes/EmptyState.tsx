import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  hasSearchQuery?: boolean;
}

export function EmptyState({ hasSearchQuery = false }: EmptyStateProps) {
  if (hasSearchQuery) {
    return (
      <div
        className="flex flex-col items-center justify-center px-4 py-16"
        data-testid="recipes-empty-state"
      >
        <div className="text-center">
          <h3 className="mb-2 text-xl font-semibold">No recipes found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any recipes matching your search. Try adjusting
            your filters or search terms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-16"
      data-testid="recipes-empty-state"
    >
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-semibold">No recipes yet</h3>
        <p className="text-muted-foreground mb-6">
          Start building your healthy meal collection by creating your first
          recipe.
        </p>
        <Button asChild>
          <a href="/recipes/new" data-testid="recipes-create-first-recipe-button">
            Create New Recipe
          </a>
        </Button>
      </div>
    </div>
  );
}
