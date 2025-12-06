import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import {
  ApiError,
  createApiErrorResponse,
  createValidationError,
  createInternalError,
  createNotFoundError,
} from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
import { validateRecipeVariantListQueryParams } from '@/lib/validation/recipe.validation';
import type { Database, Json, TablesInsert } from '@/db/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  GeneratedRecipeVariantDTO,
  RecipeVariantListResponseDTO,
} from '@/types';

/**
 * GET /api/recipes/:recipeId/variants
 * Lists all variants for a recipe
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await getAuthenticatedUserId(context);

    const { recipeId } = context.params;

    if (!recipeId) {
      throw createValidationError('Recipe ID is required');
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

    // Parse query parameters from URL
    const url = new URL(context.request.url);
    const queryParams: Record<string, string | undefined> = {};

    for (const [key, value] of url.searchParams.entries()) {
      queryParams[key] = value;
    }

    // Validate and normalize query parameters
    const validationResult = validateRecipeVariantListQueryParams(queryParams);

    if (!validationResult.success) {
      throw validationResult.error;
    }

    // Fetch variants
    const response: RecipeVariantListResponseDTO =
      await recipeService.listRecipeVariants(recipeId, validationResult.data);

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
      'Unexpected error in GET /api/recipes/:recipeId/variants:',
      error
    );
    return createApiErrorResponse(createInternalError());
  }
};

/**
 * POST /api/recipes/:recipeId/variants
 * Saves a recipe variant to the database
 */
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await getAuthenticatedUserId(context);

    const { recipeId } = context.params;

    if (!recipeId) {
      throw createValidationError('Recipe ID is required');
    }

    // Parse request body
    let body: {
      generatedRecipe: Record<string, unknown>;
      model: string;
      prompt: string;
      preferences_snapshot: Record<string, unknown>;
    } = {} as never;

    try {
      const contentType = context.request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await context.request.json();
      }
    } catch {
      throw createValidationError('Invalid request body');
    }

    if (!body.generatedRecipe || !body.model || !body.prompt) {
      throw createValidationError(
        'Generated recipe, model, and prompt are required'
      );
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

    // Convert generated recipe to variant format
    // Store as both output_text (formatted string) and output_json (structured)
    const recipeText = `Title: ${body.generatedRecipe.title as string}\n\n${
      (body.generatedRecipe.description as string) || ''
    }\n\nIngredients:\n${(
      (body.generatedRecipe.ingredients as {
        name: string;
        quantity: string;
      }[]) || []
    )
      .map((ing) => `- ${ing.quantity} ${ing.name}`)
      .join('\n')}\n\nInstructions:\n${(
      (body.generatedRecipe.instructions as string[]) || []
    )
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n')}`;

    // Save variant to database
    const insertData: TablesInsert<'recipe_variants'> = {
      recipe_id: recipeId,
      parent_variant_id: null,
      created_by: userId,
      model: body.model,
      prompt: body.prompt,
      preferences_snapshot: (body.preferences_snapshot || {}) as Json,
      output_text: recipeText,
      output_json: body.generatedRecipe as Json,
    };

    const { data: variant, error: variantError } = await (
      context.locals.supabase as SupabaseClient<Database>
    )
      .from('recipe_variants')
      .insert(insertData)
      .select()
      .single();

    if (variantError || !variant) {
      console.error('Error saving variant:', variantError);
      throw createInternalError('Failed to save recipe variant');
    }

    // Transform to DTO (exclude deleted_at)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deleted_at, ...variantDTO } = variant;

    const responseDTO: GeneratedRecipeVariantDTO = {
      ...variantDTO,
      model: variantDTO.model || body.model,
      prompt: variantDTO.prompt || body.prompt,
      preferences_snapshot:
        variantDTO.preferences_snapshot ||
        (body.preferences_snapshot as Json) ||
        null,
    };

    return new Response(JSON.stringify(responseDTO), {
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
      'Unexpected error in POST /api/recipes/:recipeId/variants:',
      error
    );
    return createApiErrorResponse(createInternalError());
  }
};
