import type { APIRoute } from 'astro';
import { updateProfileSchema } from '@/lib/validation/auth.validation';
import { createApiErrorResponse } from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
import type { Json } from '@/db/database.types';

export const PATCH: APIRoute = async (context) => {
  try {
    // Check authentication via session cookie or Bearer token
    const userId = await getAuthenticatedUserId(context);

    const body = await context.request.json();

    // Validate request body
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid request data',
            details: result.error.format(),
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      displayName,
      diets,
      allergens,
      dislikedIngredients,
      calorieTarget,
    } = result.data;
    const supabase = context.locals.supabase;

    // Check if profile exists to get current extra data
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id, extra')
      .eq('user_id', userId)
      .single();

    // Prepare update data (only include fields that are provided)
    const updateData: {
      display_name?: string | null;
      allergens?: string[] | null;
      disliked_ingredients?: string[] | null;
      calorie_target?: number | null;
      extra?: Json;
    } = {};

    if (displayName !== undefined) {
      updateData.display_name = displayName || null;
    }
    // Always include allergens if provided (even if empty array)
    if (allergens !== undefined) {
      updateData.allergens = Array.isArray(allergens) ? allergens : null;
    }
    // Always include disliked ingredients if provided (even if empty array)
    if (dislikedIngredients !== undefined) {
      updateData.disliked_ingredients = Array.isArray(dislikedIngredients)
        ? dislikedIngredients
        : null;
    }
    if (calorieTarget !== undefined) {
      updateData.calorie_target = calorieTarget || null;
    }
    if (diets !== undefined) {
      // Store diets array in extra JSONB field
      const currentExtra =
        (existingProfile?.extra as Record<string, unknown>) || {};
      updateData.extra = {
        ...currentExtra,
        diets: diets || [],
      } as Json;
    }

    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select(
          'display_name, allergens, disliked_ingredients, calorie_target, extra, updated_at'
        )
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return createApiErrorResponse({
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
        });
      }

      profile = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...updateData,
        })
        .select(
          'display_name, allergens, disliked_ingredients, calorie_target, extra, updated_at'
        )
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return createApiErrorResponse({
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'Failed to create profile',
        });
      }

      profile = data;
    }

    // Extract diets from extra field
    const extra = (profile.extra as Record<string, unknown>) || {};
    const dietsArray = (extra.diets as string[]) || [];

    return new Response(
      JSON.stringify({
        profile: {
          displayName: profile.display_name,
          diets: dietsArray,
          allergens: profile.allergens || [],
          dislikedIngredients: profile.disliked_ingredients || [],
          calorieTarget: profile.calorie_target,
          updatedAt: profile.updated_at,
        },
        message: 'Profile updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    });
  }
};
