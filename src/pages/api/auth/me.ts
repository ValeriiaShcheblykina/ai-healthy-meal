import type { APIRoute } from 'astro';
import { createApiErrorResponse } from '@/lib/errors/api-errors';
import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // Check authentication via session cookie or Bearer token
    const userId = await getAuthenticatedUserId(context);

    const supabase = context.locals.supabase;

    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return createApiErrorResponse({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Profile might not exist yet, that's okay
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is acceptable
      console.error('Error fetching profile:', profileError);
      return createApiErrorResponse({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user profile',
      });
    }

    // Extract diets from extra JSONB field
    const extra = (profile?.extra as Record<string, unknown>) || {};
    const diets = (extra.diets as string[]) || [];

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at !== null,
          profile: profile
            ? {
                displayName: profile.display_name,
                diets: diets,
                allergens: profile.allergens || [],
                dislikedIngredients: profile.disliked_ingredients || [],
                calorieTarget: profile.calorie_target,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              }
            : null,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    });
  }
};
