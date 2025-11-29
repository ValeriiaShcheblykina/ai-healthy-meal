import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { ViewToggle } from './ViewToggle';
import { GenerateRecipeButton } from './GenerateRecipeButton';
import type { RecipesListViewMode } from './ViewToggle';
import type { RecipeListQueryParams } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export type RecipesListState = Required<RecipeListQueryParams>;

export interface RecipesToolbarProps {
  filters: RecipesListState;
  viewMode: RecipesListViewMode;
  onFiltersChange: (newFilters: Partial<RecipesListState>) => void;
  onViewModeChange: (newViewMode: RecipesListViewMode) => void;
  hasRecipes?: boolean;
}

export function RecipesToolbar({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
  hasRecipes = true,
}: RecipesToolbarProps) {
  return (
    <div className="md:flex-column mb-6 flex flex-col items-start justify-between gap-4 md:items-start lg:flex-row">
      <div className="flex w-full flex-1 flex-col items-start gap-3 md:w-auto md:flex-row md:items-center">
        <SearchBar
          initialQuery={filters.search}
          onSearch={(search) => onFiltersChange({ search, page: 1 })}
        />
        <SortDropdown
          sort={filters.sort}
          order={filters.order}
          onSortChange={(sort, order) =>
            onFiltersChange({ sort, order, page: 1 })
          }
        />
      </div>
      <div className="flex gap-2 md:flex-row md:items-center md:justify-end">
        <div className="flex w-full items-center justify-between gap-2 md:w-auto md:shrink-0">
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <Button asChild className="shrink-0 whitespace-nowrap">
            <a href="/recipes/new" data-testid="recipes-new-recipe-button">
              <Plus className="mr-1.5 h-4 w-4 shrink-0 md:mr-2" />
              <span className="hidden md:inline">New Recipe</span>
              <span className="md:hidden">New</span>
            </a>
          </Button>
        </div>
        <GenerateRecipeButton disabled={!hasRecipes} />
      </div>
    </div>
  );
}
