import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import { RecipeService } from '@/lib/services/recipe.service';
import {
  ApiError,
  createApiErrorResponse,
  createValidationError,
  createInternalError,
} from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
import type { Database } from '@/db/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/recipes/ai-generation
 * Generates a new recipe based on user's existing recipes and preferences
 */
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication via session cookie or Bearer token
    const userId = await getAuthenticatedUserId(context);

    // Parse request body (optional parameters)
    let body: {
      model?: string;
      customPrompt?: string;
      temperature?: number;
      maxRecipes?: number;
      diets?: string[]; // Optional: override profile diets
    } = {};

    try {
      const contentType = context.request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await context.request.json();
      }
    } catch {
      // Body is optional, continue with defaults
    }

    // Fetch user profile for preferences
    const { data: profile, error: profileError } = await (
      context.locals.supabase as SupabaseClient<Database>
    )
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    // Fetch user's recipes (optional - only if not generating from diets only)
    let existingRecipes: { title: string; content: string }[] = [];

    // If diets are provided, we can generate without existing recipes
    // Otherwise, we need at least one recipe
    if (!body.diets || body.diets.length === 0) {
      const recipeService = new RecipeService(context.locals.supabase);
      const recipesResult = await recipeService.listRecipes({
        page: 1,
        limit: body.maxRecipes || 10, // Use up to 10 recipes by default
        search: '',
        sort: 'created_at',
        order: 'desc',
      });

      if (recipesResult.data.length === 0) {
        throw createValidationError(
          'You need at least one recipe in your list to generate a new recipe, or select dietary preferences to generate based on your diet'
        );
      }

      // Prepare existing recipes for generation
      existingRecipes = recipesResult.data.map((recipe) => ({
        title: recipe.title,
        content: recipe.content || JSON.stringify(recipe.content_json || {}),
      }));
    } else {
      // If generating from diets, optionally fetch some recipes for context
      const recipeService = new RecipeService(context.locals.supabase);
      const recipesResult = await recipeService.listRecipes({
        page: 1,
        limit: body.maxRecipes || 5, // Use fewer recipes when diets are specified
        search: '',
        sort: 'created_at',
        order: 'desc',
      });

      // Prepare existing recipes for generation (optional context)
      existingRecipes = recipesResult.data.map((recipe) => ({
        title: recipe.title,
        content: recipe.content || JSON.stringify(recipe.content_json || {}),
      }));
    }

    // Build custom prompt with preferences if available
    let customPrompt = body.customPrompt || '';
    if (profile || body.diets) {
      const preferences: string[] = [];

      // Use diets from request body if provided, otherwise from profile
      let dietsToUse: string[] = [];
      if (body.diets && body.diets.length > 0) {
        dietsToUse = body.diets;
      } else if (profile) {
        const extra = (profile.extra as Record<string, unknown>) || {};
        dietsToUse = (extra.diets as string[]) || [];
        // Fallback to old diet field if diets array is empty
        if (
          dietsToUse.length === 0 &&
          profile.diet &&
          profile.diet !== 'none'
        ) {
          dietsToUse = [profile.diet];
        }
      }

      if (dietsToUse.length > 0) {
        preferences.push(`Dietary preferences: ${dietsToUse.join(', ')}`);
      }

      if (profile) {
        if (profile.allergens && profile.allergens.length > 0) {
          preferences.push(
            `Allergens to avoid: ${profile.allergens.join(', ')}`
          );
        }
        if (
          profile.disliked_ingredients &&
          profile.disliked_ingredients.length > 0
        ) {
          preferences.push(
            `Disliked ingredients to avoid: ${profile.disliked_ingredients.join(', ')}`
          );
        }
        if (profile.calorie_target) {
          preferences.push(
            `Target calorie range: around ${profile.calorie_target} calories per serving`
          );
        }
      }

      if (preferences.length > 0) {
        customPrompt +=
          (customPrompt ? '\n\n' : '') +
          `User preferences:\n${preferences.join('\n')}`;
      }
    }

    // Initialize OpenRouter service
    // Support both Node.js (import.meta.env) and Cloudflare (runtime.env)
    const apiKey =
      context.locals.runtime?.env?.OPEN_ROUTER_API_KEY ??
      import.meta.env.OPEN_ROUTER_API_KEY;

    if (!apiKey) {
      // Log available env keys for debugging (without values)
      const availableKeys = Object.keys(import.meta.env).filter(
        (key) => key.includes('OPEN_ROUTER_API_KEY') || key.includes('API')
      );
      console.error(
        '[OpenRouter] API key not found. Available env keys:',
        availableKeys
      );
      console.error(
        '[OpenRouter] Runtime env keys:',
        context.locals.runtime?.env
          ? Object.keys(context.locals.runtime.env)
          : 'none'
      );
      throw createInternalError(
        'OpenRouter API key is not configured. Please ensure OPEN_ROUTER_API_KEY is set in your .env file and restart the dev server.'
      );
    }

    const openRouterService = new OpenRouterService(apiKey);

    // Generate recipe
    // Use a model that supports JSON schema mode
    // Try gpt-4o-2024-08-06 or gpt-4-turbo which better support structured outputs
    const model = body.model || 'openai/gpt-4o-2024-08-06';

    const response = await openRouterService.generateRecipeFromExisting({
      existingRecipes,
      model,
      customPrompt: customPrompt || undefined,
      temperature: body.temperature ?? 0.8,
      max_tokens: 2000,
    });

    // Extract generated recipe
    const generatedRecipe = response.choices[0].message.content;

    if (
      !generatedRecipe ||
      typeof generatedRecipe !== 'object' ||
      !('title' in generatedRecipe)
    ) {
      throw createInternalError('Invalid recipe format received from AI');
    }

    // Return generated recipe
    return new Response(JSON.stringify(generatedRecipe), {
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
      'Unexpected error in POST /api/recipes/ai-generation:',
      error
    );
    return createApiErrorResponse(createInternalError());
  }
};
