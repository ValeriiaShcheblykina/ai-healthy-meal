import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import {
  ApiError,
  createApiErrorResponse,
  createValidationError,
  createInternalError,
} from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';

/**
 * POST /api/openrouter/generate-variant
 * Proxy endpoint for OpenRouter variant generation (keeps API key secure)
 */
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    await getAuthenticatedUserId(context);

    // Parse request body
    let body: {
      existingRecipe: { title: string; content: string };
      model?: string;
      customPrompt?: string;
      temperature?: number;
      max_tokens?: number;
    } = {} as never;

    try {
      const contentType = context.request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await context.request.json();
      }
    } catch {
      throw createValidationError('Invalid request body');
    }

    if (!body.existingRecipe || !body.existingRecipe.title) {
      throw createValidationError('Existing recipe is required');
    }

    // Initialize OpenRouter service
    const apiKey =
      context.locals.runtime?.env?.OPEN_ROUTER_API_KEY ??
      import.meta.env.OPEN_ROUTER_API_KEY;

    if (!apiKey) {
      throw createInternalError(
        'OpenRouter API key is not configured. Please ensure OPEN_ROUTER_API_KEY is set in your .env file and restart the dev server.'
      );
    }

    const openRouterService = new OpenRouterService(apiKey);

    // Build variant-specific prompt
    const variantPrompt = `Create a variant of this recipe that:
- Maintains the core essence and style of the original recipe
- Adapts it according to the user's dietary preferences and requirements (if provided)
- Makes it unique while keeping it recognizable as a variation
- Preserves the cooking techniques and flavor profile where possible

Original recipe:
${body.existingRecipe.title}

${body.existingRecipe.content}

${body.customPrompt ? `\n\n${body.customPrompt}` : ''}

Generate a variant recipe that is a creative adaptation of the original.`;

    // Generate variant using OpenRouter
    const model = body.model || 'openai/gpt-4o-2024-08-06';

    const response = await openRouterService.generateRecipeFromExisting({
      existingRecipes: [body.existingRecipe],
      model,
      customPrompt: variantPrompt,
      temperature: body.temperature ?? 0.8,
      max_tokens: body.max_tokens ?? 2000,
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
      'Unexpected error in POST /api/openrouter/generate-variant:',
      error
    );
    return createApiErrorResponse(createInternalError());
  }
};
