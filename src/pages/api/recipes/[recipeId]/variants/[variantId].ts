import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import {
  ApiError,
  createApiErrorResponse,
  createValidationError,
  createNotFoundError,
  createErrorResponse,
} from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
import type { RecipeVariantDTO } from '@/types';

/**
 * GET /api/recipes/:recipeId/variants/:variantId
 * Gets a single recipe variant by ID
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await getAuthenticatedUserId(context);

    const { recipeId, variantId } = context.params;

    if (!recipeId) {
      throw createValidationError('Recipe ID is required');
    }

    if (!variantId) {
      throw createValidationError('Variant ID is required');
    }

    // Verify recipe exists and user owns it
    const recipeService = new RecipeService(context.locals.supabase);
    const recipe = await recipeService.getRecipe(recipeId);

    if (!recipe) {
      throw createNotFoundError('Recipe not found');
    }

    if (recipe.user_id !== userId) {
      throw createNotFoundError('Recipe not found');
    }

    // Fetch variant
    const variant = await recipeService.getRecipeVariant(recipeId, variantId);

    if (!variant) {
      throw createNotFoundError('Variant not found');
    }

    // Transform to DTO (exclude deleted_at)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deleted_at, ...variantDTO } = variant;

    const response: RecipeVariantDTO = variantDTO;

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

    console.error(
      'Unexpected error in GET /api/recipes/:recipeId/variants/:variantId:',
      error
    );
    return createApiErrorResponse(
      createNotFoundError('An unexpected error occurred')
    );
  }
};

/**
 * DELETE /api/recipes/:recipeId/variants/:variantId
 * Soft-deletes a recipe variant for the authenticated user
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    await getAuthenticatedUserId(context);

    const { recipeId, variantId } = context.params;

    if (!recipeId) {
      throw createNotFoundError('Recipe ID is required');
    }

    if (!variantId) {
      throw createNotFoundError('Variant ID is required');
    }

    // Check if variant exists and user owns the parent recipe
    const recipeService = new RecipeService(context.locals.supabase);
    const existingVariant = await recipeService.getRecipeVariant(
      recipeId,
      variantId
    );

    if (!existingVariant) {
      throw createNotFoundError('Variant not found');
    }

    // Delete variant (soft delete)
    await recipeService.deleteRecipeVariant(recipeId, variantId);

    return new Response(null, {
      status: 204, // No Content
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiErrorResponse(error);
    }

    console.error(
      'Unexpected error in DELETE /api/recipes/:recipeId/variants/:variantId:',
      error
    );
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
