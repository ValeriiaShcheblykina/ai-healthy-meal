import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import {
  ApiError,
  createErrorResponse,
  createNotFoundError,
  createApiErrorResponse,
} from '@/lib/errors/api-errors';
import { validateRecipeData } from '@/lib/validation/recipe.validation';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
import { parseJsonBody } from '@/lib/api/parse-request-body';
import type { RecipeListItemDTO } from '@/types';

/**
 * GET /api/recipes/:id
 * Gets a single recipe by ID for the authenticated user
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    await getAuthenticatedUserId(context);

    const { id } = context.params;

    if (!id) {
      throw createNotFoundError('Recipe ID is required');
    }

    // Fetch recipe
    const recipeService = new RecipeService(context.locals.supabase);
    const recipe = await recipeService.getRecipe(id);

    if (!recipe) {
      throw createNotFoundError('Recipe not found');
    }

    // Transform to DTO (exclude internal fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content_tsv, deleted_at, user_id, ...recipeDTO } = recipe;

    // For now, return recipe without variants (we'll add variants later)
    const response: RecipeListItemDTO = recipeDTO;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiErrorResponse(error);
    }

    console.error('Unexpected error in GET /api/recipes/:id:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

/**
 * PUT /api/recipes/:id
 * Updates a recipe for the authenticated user
 */
export const PUT: APIRoute = async (context) => {
  try {
    // Check authentication
    await getAuthenticatedUserId(context);

    const { id } = context.params;

    if (!id) {
      throw createNotFoundError('Recipe ID is required');
    }

    // Parse request body
    const body = (await parseJsonBody(context.request)) as Record<
      string,
      unknown
    >;

    // Validate recipe data
    const validationResult = validateRecipeData(body, false); // false = update mode

    if (!validationResult.success) {
      throw validationResult.error;
    }

    // Check if recipe exists
    const recipeService = new RecipeService(context.locals.supabase);
    const existingRecipe = await recipeService.getRecipe(id);

    if (!existingRecipe) {
      throw createNotFoundError('Recipe not found');
    }

    // Update recipe
    const updatedRecipe = await recipeService.updateRecipe(
      id,
      validationResult.data
    );

    // Transform to DTO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content_tsv, deleted_at, user_id, ...recipeDTO } = updatedRecipe;

    return new Response(JSON.stringify(recipeDTO), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiErrorResponse(error);
    }

    console.error('Unexpected error in PUT /api/recipes/:id:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

/**
 * DELETE /api/recipes/:id
 * Soft-deletes a recipe for the authenticated user
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    await getAuthenticatedUserId(context);

    const { id } = context.params;

    if (!id) {
      throw createNotFoundError('Recipe ID is required');
    }

    // Check if recipe exists
    const recipeService = new RecipeService(context.locals.supabase);
    const existingRecipe = await recipeService.getRecipe(id);

    if (!existingRecipe) {
      throw createNotFoundError('Recipe not found');
    }

    // Delete recipe (soft delete)
    await recipeService.deleteRecipe(id);

    return new Response(null, {
      status: 204, // No Content
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiErrorResponse(error);
    }

    console.error('Unexpected error in DELETE /api/recipes/:id:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
