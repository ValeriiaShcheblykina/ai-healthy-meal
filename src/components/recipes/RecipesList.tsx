import { useState, useEffect, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RecipesToolbar, type RecipesListState } from './RecipesToolbar'
import { RecipesGrid } from './RecipesGrid'
import { RecipesListItems } from './RecipesListItems'
import { EmptyState } from './EmptyState'
import { SkeletonLoader } from './SkeletonLoader'
import { PaginationControls } from './PaginationControls'
import { useRecipesQuery } from '@/components/hooks/useRecipesQuery'
import { useLocalStorage } from '@/components/hooks/useLocalStorage'
import type { RecipesListViewMode } from './ViewToggle'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient()

function RecipesListContent() {
  // Parse initial state from URL
  const getInitialFilters = (): RecipesListState => {
    if (typeof window === 'undefined') {
      return {
        page: 1,
        limit: 20,
        search: '',
        sort: 'created_at',
        order: 'desc',
      }
    }

    const params = new URLSearchParams(window.location.search)
    
    return {
      page: Math.max(1, parseInt(params.get('page') || '1', 10)),
      limit: Math.max(1, Math.min(100, parseInt(params.get('limit') || '20', 10))),
      search: params.get('search') || '',
      sort: (params.get('sort') as RecipesListState['sort']) || 'created_at',
      order: (params.get('order') as RecipesListState['order']) || 'desc',
    }
  }

  const [filters, setFilters] = useState<RecipesListState>(getInitialFilters)
  const [viewMode, setViewMode] = useLocalStorage<RecipesListViewMode>('recipes-view-mode', 'grid')

  // Fetch recipes using TanStack Query
  const { data, isLoading, error, refetch } = useRecipesQuery(filters)

  // Sync filters to URL
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams()
    params.set('page', filters.page.toString())
    params.set('limit', filters.limit.toString())
    if (filters.search) params.set('search', filters.search)
    params.set('sort', filters.sort)
    params.set('order', filters.order)

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState({}, '', newUrl)
  }, [filters])

  const handleFiltersChange = useCallback((newFilters: Partial<RecipesListState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Error state
  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-16 px-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2 text-destructive">Failed to load recipes</h3>
          <p className="text-muted-foreground mb-6">
            An error occurred while fetching your recipes. Please try again.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="sr-only" role="status" aria-live="polite">
          Loading recipes...
        </div>
        <RecipesToolbar
          filters={filters}
          viewMode={viewMode}
          onFiltersChange={handleFiltersChange}
          onViewModeChange={setViewMode}
        />
        <SkeletonLoader viewMode={viewMode} />
      </>
    )
  }

  // Empty state
  const recipes = data?.data || []
  const hasSearchQuery = filters.search.trim().length > 0

  if (recipes.length === 0) {
    return (
      <>
        <RecipesToolbar
          filters={filters}
          viewMode={viewMode}
          onFiltersChange={handleFiltersChange}
          onViewModeChange={setViewMode}
        />
        <EmptyState hasSearchQuery={hasSearchQuery} />
      </>
    )
  }

  // Data state
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} 
        {data?.pagination && ` (page ${data.pagination.page} of ${data.pagination.total_pages})`}
      </div>
      <RecipesToolbar
        filters={filters}
        viewMode={viewMode}
        onFiltersChange={handleFiltersChange}
        onViewModeChange={setViewMode}
      />
      {viewMode === 'grid' ? (
        <RecipesGrid recipes={recipes} />
      ) : (
        <RecipesListItems recipes={recipes} />
      )}
      {data?.pagination && (
        <PaginationControls pagination={data.pagination} onPageChange={handlePageChange} />
      )}
    </>
  )
}

export function RecipesList() {
  return (
    <QueryClientProvider client={queryClient}>
      <RecipesListContent />
    </QueryClientProvider>
  )
}

