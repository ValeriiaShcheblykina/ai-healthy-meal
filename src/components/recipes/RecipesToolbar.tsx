import { SearchBar } from './SearchBar'
import { SortDropdown } from './SortDropdown'
import { ViewToggle } from './ViewToggle'
import type { RecipesListViewMode } from './ViewToggle'
import type { RecipeListQueryParams } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export type RecipesListState = Required<RecipeListQueryParams>

export interface RecipesToolbarProps {
  filters: RecipesListState
  viewMode: RecipesListViewMode
  onFiltersChange: (newFilters: Partial<RecipesListState>) => void
  onViewModeChange: (newViewMode: RecipesListViewMode) => void
}

export function RecipesToolbar({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
}: RecipesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full sm:w-auto">
        <SearchBar
          initialQuery={filters.search}
          onSearch={(search) => onFiltersChange({ search, page: 1 })}
        />
        <SortDropdown
          sort={filters.sort}
          order={filters.order}
          onSortChange={(sort, order) => onFiltersChange({ sort, order, page: 1 })}
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <Button asChild>
          <a href="/recipes/new">
            <Plus className="h-4 w-4 mr-2" />
            New Recipe
          </a>
        </Button>
      </div>
    </div>
  )
}

