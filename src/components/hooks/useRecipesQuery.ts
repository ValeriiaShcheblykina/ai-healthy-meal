import { useQuery } from '@tanstack/react-query';
import type { RecipeListResponseDTO, RecipeListQueryParams } from '@/types';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';

const recipesService = new RecipesClientService();

async function fetchRecipes(
  params: RecipeListQueryParams
): Promise<RecipeListResponseDTO> {
  return recipesService.listRecipes(params);
}

export function useRecipesQuery(params: RecipeListQueryParams) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => fetchRecipes(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message === 'Authentication required') {
        return false;
      }
      return failureCount < 3;
    },
  });
}
