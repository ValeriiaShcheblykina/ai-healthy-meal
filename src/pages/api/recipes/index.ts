import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import {
  validateRecipeListQueryParams,
  validateRecipeData,
} from '@/lib/validation/recipe.validation';
import {
  ApiError,
  createErrorResponse,
  createUnauthorizedError,
  createApiErrorResponse,
  createValidationError,
} from '@/lib/errors/api-errors';
import type { RecipeListResponseDTO, RecipeListItemDTO } from '@/types';

export const prerender = false;

/**
 * GET /api/recipes
 * Lists recipes for the authenticated user with pagination, search, and sorting
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication via session cookie or Bearer token
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      // API token authentication
      const token = authHeader.substring('Bearer '.length);
      const { data, error } = await locals.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw createUnauthorizedError();
      }
    } else {
      // Session cookie authentication
      const { data, error } = await locals.supabase.auth.getUser();

      if (error || !data.user) {
        throw createUnauthorizedError();
      }
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

/**
 * POST /api/recipes
 * Creates a new recipe for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length);
      const { data, error } = await locals.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw createUnauthorizedError();
      }
      userId = data.user.id;
    } else {
      const { data, error } = await locals.supabase.auth.getUser();

      if (error || !data.user) {
        throw createUnauthorizedError();
      }
      userId = data.user.id;
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw createValidationError('Invalid JSON in request body');
    }

    // Validate recipe data
    const validationResult = validateRecipeData(body, true); // true = create mode (all required fields)

    if (!validationResult.success) {
      throw validationResult.error;
    }

    // Create recipe
    const recipeService = new RecipeService(locals.supabase);
    const newRecipe = await recipeService.createRecipe(
      userId,
      validationResult.data
    );

    // Transform to DTO (exclude internal fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content_tsv, deleted_at, user_id, ...recipeDTO } = newRecipe;

    const response: RecipeListItemDTO = recipeDTO;

    return new Response(JSON.stringify(response), {
      status: 201, // Created
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiErrorResponse(error);
    }

    console.error('Unexpected error in POST /api/recipes:', error);
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
