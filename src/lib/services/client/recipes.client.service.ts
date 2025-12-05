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
import { ProfileClientService } from './profile.client.service';
import type {
  RecipeListQueryParams,
  RecipeListResponseDTO,
  RecipeListItemDTO,
  CreateRecipeCommand,
  UpdateRecipeCommand,
  GeneratedRecipeVariantDTO,
  GenerateRecipeVariantCommand,
  RecipeVariantListQueryParams,
  RecipeVariantListResponseDTO,
  RecipeVariantDTO,
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
   * @param {string[]} [options.diets] - Dietary preferences
   * @param {string[]} [options.allergens] - Allergens to avoid
   * @param {string[]} [options.dislikedIngredients] - Disliked ingredients to avoid
   * @param {number | null} [options.calorieTarget] - Target calories per serving
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
    allergens?: string[];
    dislikedIngredients?: string[];
    calorieTarget?: number | null;
  }): Promise<Record<string, unknown>> {
    return fetchApi<Record<string, unknown>>(
      `${this.baseUrl}/ai-generation`,
      { method: 'POST', body: options || {} },
      { defaultMessage: 'Failed to generate recipe. Please try again.' }
    );
  }

  /**
   * Generates a recipe variant based on an existing recipe and user preferences.
   * Handles the full flow: fetching recipe, building prompts, calling OpenRouter, and saving variant.
   *
   * @async
   * @method generateRecipeVariant
   * @param {string} recipeId - ID of the recipe to create a variant from
   * @param {GenerateRecipeVariantCommand} [options] - Optional generation parameters
   * @returns {Promise<GeneratedRecipeVariantDTO>} Generated recipe variant
   *
   * @throws {Error} If generation fails
   */
  async generateRecipeVariant(
    recipeId: string,
    options?: GenerateRecipeVariantCommand
  ): Promise<GeneratedRecipeVariantDTO> {
    const opts = options || { use_profile_preferences: true };

    // Step 1: Fetch the recipe
    const recipe = await this.getRecipe(recipeId);

    // Step 2: Build preferences prompt if needed
    let customPrompt = opts.custom_prompt || '';
    const preferencesSnapshot: Record<string, unknown> = {};

    if (opts.use_profile_preferences) {
      const profileService = new ProfileClientService();
      const userData = await profileService.getCurrentUser();
      const profile = userData.user.profile;

      if (profile) {
        const diets = profile.diets || [];
        preferencesSnapshot.diets = diets;
        preferencesSnapshot.allergens = profile.allergens || [];
        preferencesSnapshot.dislikedIngredients =
          profile.dislikedIngredients || [];
        preferencesSnapshot.calorieTarget = profile.calorieTarget;

        // Build preferences string for prompt
        const preferences: string[] = [];

        if (diets.length > 0) {
          preferences.push(`Dietary preferences: ${diets.join(', ')}`);
        }

        if (profile.allergens && profile.allergens.length > 0) {
          preferences.push(
            `Allergens to avoid: ${profile.allergens.join(', ')}`
          );
        }

        if (
          profile.dislikedIngredients &&
          profile.dislikedIngredients.length > 0
        ) {
          preferences.push(
            `Disliked ingredients to avoid: ${profile.dislikedIngredients.join(', ')}`
          );
        }

        if (profile.calorieTarget) {
          preferences.push(
            `Target calorie range: around ${profile.calorieTarget} calories per serving`
          );
        }

        if (preferences.length > 0) {
          customPrompt +=
            (customPrompt ? '\n\n' : '') +
            `User preferences:\n${preferences.join('\n')}`;
        }
      }
    }

    // Step 3: Prepare recipe data for OpenRouter
    const existingRecipe = {
      title: recipe.title,
      content: recipe.content || JSON.stringify(recipe.content_json || {}),
    };

    // Step 4: Call OpenRouter proxy endpoint
    const model = opts.model || 'openai/gpt-4o-2024-08-06';
    const generatedRecipe = await fetchApi<Record<string, unknown>>(
      '/api/openrouter/generate-variant',
      {
        method: 'POST',
        body: {
          existingRecipe,
          model,
          customPrompt: customPrompt || undefined,
          temperature: 0.8,
          max_tokens: 2000,
        },
      },
      { defaultMessage: 'Failed to generate recipe variant. Please try again.' }
    );

    // Step 5: Build variant prompt for saving
    const variantPrompt = `Create a variant of this recipe that:
- Maintains the core essence and style of the original recipe
- Adapts it according to the user's dietary preferences and requirements (if provided)
- Makes it unique while keeping it recognizable as a variation
- Preserves the cooking techniques and flavor profile where possible

Original recipe:
${existingRecipe.title}

${existingRecipe.content}

${customPrompt ? `\n\n${customPrompt}` : ''}

Generate a variant recipe that is a creative adaptation of the original.`;

    // Step 6: Save variant to database
    return fetchApi<GeneratedRecipeVariantDTO>(
      `${this.baseUrl}/${recipeId}/variants`,
      {
        method: 'POST',
        body: {
          generatedRecipe,
          model,
          prompt: variantPrompt,
          preferences_snapshot: preferencesSnapshot,
        },
      },
      { defaultMessage: 'Failed to save recipe variant. Please try again.' }
    );
  }

  /**
   * Fetches a list of recipe variants for a specific recipe.
   *
   * @async
   * @method listRecipeVariants
   * @param {string} recipeId - Recipe ID
   * @param {RecipeVariantListQueryParams} [params] - Optional query parameters
   * @returns {Promise<RecipeVariantListResponseDTO>} Variant list with pagination
   *
   * @throws {Error} If request fails or authentication is required
   */
  async listRecipeVariants(
    recipeId: string,
    params?: RecipeVariantListQueryParams
  ): Promise<RecipeVariantListResponseDTO> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    return fetchApi<RecipeVariantListResponseDTO>(
      `${this.baseUrl}/${recipeId}/variants?${searchParams.toString()}`,
      { method: 'GET' },
      { defaultMessage: 'Failed to fetch recipe variants' }
    );
  }

  /**
   * Fetches a single recipe variant by ID.
   *
   * @async
   * @method getRecipeVariant
   * @param {string} recipeId - Recipe ID
   * @param {string} variantId - Variant ID
   * @returns {Promise<RecipeVariantDTO>} Variant data
   *
   * @throws {Error} If variant not found or request fails
   */
  async getRecipeVariant(
    recipeId: string,
    variantId: string
  ): Promise<RecipeVariantDTO> {
    return fetchApi<RecipeVariantDTO>(
      `${this.baseUrl}/${recipeId}/variants/${variantId}`,
      { method: 'GET' },
      {
        defaultMessage: 'Failed to fetch recipe variant',
        notFoundMessage: 'Recipe variant not found',
      }
    );
  }

  /**
   * Deletes a recipe variant.
   *
   * @async
   * @method deleteRecipeVariant
   * @param {string} recipeId - Recipe ID
   * @param {string} variantId - Variant ID
   * @returns {Promise<void>}
   *
   * @throws {Error} If deletion fails
   */
  async deleteRecipeVariant(
    recipeId: string,
    variantId: string
  ): Promise<void> {
    await fetchApi(
      `${this.baseUrl}/${recipeId}/variants/${variantId}`,
      { method: 'DELETE' },
      {
        defaultMessage: 'Failed to delete recipe variant',
        notFoundMessage: 'Recipe variant not found',
      }
    );
  }
}
