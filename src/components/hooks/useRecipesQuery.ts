import { useQuery } from '@tanstack/react-query'
import type { RecipeListResponseDTO, RecipeListQueryParams } from '@/types'

async function fetchRecipes(params: RecipeListQueryParams): Promise<RecipeListResponseDTO> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.order) searchParams.set('order', params.order)

  // Use cookie-based authentication (cookies are automatically included)
  const response = await fetch(`/api/recipes?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies in request
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Redirect to sign-in on auth failure
      window.location.href = '/sign-in'
      throw new Error('Authentication required')
    }
    throw new Error('Failed to fetch recipes')
  }

  return response.json()
}

export function useRecipesQuery(params: RecipeListQueryParams) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => fetchRecipes(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message === 'Authentication required') {
        return false
      }
      return failureCount < 3
    },
  })
}

