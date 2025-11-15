import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import { validateRecipeListQueryParams } from '@/lib/validation/recipe.validation';
import {
  ApiError,
  createErrorResponse,
  createUnauthorizedError,
} from '@/lib/errors/api-errors';
import type { RecipeListResponseDTO } from '@/types';

export const prerender = false;

/**
 * GET /api/recipes
 * Lists recipes for the authenticated user with pagination, search, and sorting
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication via session cookie or Bearer token
    const authHeader = request.headers.get('authorization');

    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      // API token authentication
      const token = authHeader.substring('Bearer '.length);
      const { data, error } = await locals.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw createUnauthorizedError();
      }

      userId = data.user.id;
    } else {
      // Session cookie authentication
      const { data, error } = await locals.supabase.auth.getUser();

      if (error || !data.user) {
        throw createUnauthorizedError();
      }

      userId = data.user.id;
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const queryParams: Record<string, string | undefined> = {};

    for (const [key, value] of url.searchParams.entries()) {
      queryParams[key] = value;
    }

    // Validate and normalize query parameters
    const validationResult = validateRecipeListQueryParams(queryParams);

    if (!validationResult.success) {
      throw validationResult.error;
    }

    // Create service instance and fetch recipes
    const recipeService = new RecipeService(locals.supabase);
    const response: RecipeListResponseDTO = await recipeService.listRecipes(
      validationResult.data
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Handle ApiError instances
    if (error instanceof ApiError) {
      return new Response(
        JSON.stringify(
          createErrorResponse(error.code, error.message, error.details)
        ),
        {
          status: error.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in GET /api/recipes:', error);
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
