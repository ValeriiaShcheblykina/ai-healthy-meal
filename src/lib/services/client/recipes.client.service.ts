/**
 * @module recipes.client.service
 * @description Frontend service for recipe-related API calls.
 * Centralizes all recipe API interactions for the client-side application.
 *
 * This service provides:
 * - Recipe CRUD operations
 * - Recipe generation from existing recipes
 * - Consistent error handling
 * - Authentication handling
 *
 * @example
 * import { RecipesClientService } from '@/lib/services/client/recipes.client.service';
 *
 * const service = new RecipesClientService();
 * const recipes = await service.listRecipes({ page: 1, limit: 20 });
 */

import { fetchApi } from './api-client.helper';
import type {
  RecipeListQueryParams,
  RecipeListResponseDTO,
  RecipeListItemDTO,
  CreateRecipeCommand,
  UpdateRecipeCommand,
} from '@/types';

/**
 * Client-side service for recipe API operations.
 *
 * All methods handle authentication automatically via cookies.
 * Errors are thrown as Error instances with appropriate messages.
 */
export class RecipesClientService {
  private readonly baseUrl = '/api/recipes';

  /**
   * Fetches a list of recipes with pagination, search, and sorting.
   *
   * @async
   * @method listRecipes
   * @param {RecipeListQueryParams} params - Query parameters
   * @returns {Promise<RecipeListResponseDTO>} Recipe list with pagination
   *
   * @throws {Error} If request fails or authentication is required
   */
  async listRecipes(
    params: RecipeListQueryParams
  ): Promise<RecipeListResponseDTO> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.order) searchParams.set('order', params.order);

    return fetchApi<RecipeListResponseDTO>(
      `${this.baseUrl}?${searchParams.toString()}`,
      { method: 'GET' },
      { defaultMessage: 'Failed to fetch recipes' }
    );
  }

  /**
   * Fetches a single recipe by ID.
   *
   * @async
   * @method getRecipe
   * @param {string} id - Recipe ID
   * @returns {Promise<RecipeListItemDTO>} Recipe data
   *
   * @throws {Error} If recipe not found or request fails
   */
  async getRecipe(id: string): Promise<RecipeListItemDTO> {
    return fetchApi<RecipeListItemDTO>(
      `${this.baseUrl}/${id}`,
      { method: 'GET' },
      {
        defaultMessage: 'Failed to fetch recipe',
        notFoundMessage: 'Recipe not found',
      }
    );
  }

  /**
   * Creates a new recipe.
   *
   * @async
   * @method createRecipe
   * @param {CreateRecipeCommand} data - Recipe data
   * @returns {Promise<RecipeListItemDTO>} Created recipe
   *
   * @throws {Error} If creation fails
   */
  async createRecipe(data: CreateRecipeCommand): Promise<RecipeListItemDTO> {
    return fetchApi<RecipeListItemDTO>(
      this.baseUrl,
      { method: 'POST', body: data },
      { defaultMessage: 'Failed to create recipe' }
    );
  }

  /**
   * Updates an existing recipe.
   *
   * @async
   * @method updateRecipe
   * @param {string} id - Recipe ID
   * @param {UpdateRecipeCommand} data - Updated recipe data
   * @returns {Promise<RecipeListItemDTO>} Updated recipe
   *
   * @throws {Error} If update fails
   */
  async updateRecipe(
    id: string,
    data: UpdateRecipeCommand
  ): Promise<RecipeListItemDTO> {
    return fetchApi<RecipeListItemDTO>(
      `${this.baseUrl}/${id}`,
      { method: 'PUT', body: data },
      {
        defaultMessage: 'Failed to update recipe',
        notFoundMessage: 'Recipe not found',
      }
    );
  }

  /**
   * Deletes a recipe.
   *
   * @async
   * @method deleteRecipe
   * @param {string} id - Recipe ID
   * @returns {Promise<void>}
   *
   * @throws {Error} If deletion fails
   */
  async deleteRecipe(id: string): Promise<void> {
    await fetchApi(
      `${this.baseUrl}/${id}`,
      { method: 'DELETE' },
      {
        defaultMessage: 'Failed to delete recipe',
        notFoundMessage: 'Recipe not found',
      }
    );
  }

  /**
   * Generates a new recipe using AI based on user's existing recipes and preferences.
   *
   * @async
   * @method aiGenerateRecipe
   * @param {Object} [options] - Optional generation parameters
   * @param {string} [options.model] - Model to use for generation
   * @param {string} [options.customPrompt] - Custom prompt for generation
   * @param {number} [options.temperature] - Temperature parameter
   * @param {number} [options.maxRecipes] - Maximum number of recipes to use as context
   * @returns {Promise<Record<string, unknown>>} Generated recipe data
   *
   * @throws {Error} If generation fails
   */
  async aiGenerateRecipe(options?: {
    model?: string;
    customPrompt?: string;
    temperature?: number;
    maxRecipes?: number;
    diets?: string[];
  }): Promise<Record<string, unknown>> {
    return fetchApi<Record<string, unknown>>(
      `${this.baseUrl}/ai-generation`,
      { method: 'POST', body: options || {} },
      { defaultMessage: 'Failed to generate recipe. Please try again.' }
    );
  }
}
