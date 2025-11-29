import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import {
  validateRecipeListQueryParams,
  validateRecipeData,
} from '@/lib/validation/recipe.validation';
import {
  ApiError,
  createErrorResponse,
  createApiErrorResponse,
  createValidationError,
} from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
import { parseJsonBody } from '@/lib/api/parse-request-body';
import type { RecipeListResponseDTO, RecipeListItemDTO } from '@/types';

export const prerender = false;

/**
 * GET /api/recipes
 * Lists recipes for the authenticated user with pagination, search, and sorting
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication via session cookie or Bearer token
    await getAuthenticatedUserId(context);

    // Parse query parameters from URL
    const url = new URL(context.request.url);
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
    const recipeService = new RecipeService(context.locals.supabase);
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
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await getAuthenticatedUserId(context);

    // Parse request body
    const body = (await parseJsonBody(context.request)) as Record<
      string,
      unknown
    >;

    // Validate recipe data
    const validationResult = validateRecipeData(body, true); // true = create mode (all required fields)

    if (!validationResult.success) {
      throw validationResult.error;
    }

    // In create mode, validation ensures title is required, so it will be defined
    // Defensive check (should never happen if validation passed)
    if (!validationResult.data.title) {
      throw createValidationError('Title is required for recipe creation');
    }

    // Normalize data for createRecipe (convert undefined to null for optional fields)
    const createData = {
      title: validationResult.data.title,
      content: validationResult.data.content ?? null,
      content_json: validationResult.data.content_json ?? null,
      is_public: validationResult.data.is_public ?? false,
    };

    // Create recipe
    const recipeService = new RecipeService(context.locals.supabase);
    const newRecipe = await recipeService.createRecipe(userId, createData);

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
