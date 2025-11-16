import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { ViewToggle } from './ViewToggle';
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
}

export function RecipesToolbar({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
}: RecipesToolbarProps) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex w-full flex-1 flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center">
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
      <div className="flex w-full justify-between gap-2 sm:w-auto sm:justify-end">
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <Button asChild>
          <a href="/recipes/new" data-testid="recipes-new-recipe-button">
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </a>
        </Button>
      </div>
    </div>
  );
}
