import type { APIRoute } from 'astro';
import { signInSchema } from '@/lib/validation/auth.validation';
import { createApiErrorResponse } from '@/lib/errors/api-errors';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = signInSchema.safeParse(body);
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

    const { email, password } = result.data;
    const supabase = locals.supabase;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let message = 'Invalid email or password';

      if (import.meta.env.DEV) {
        // Show detailed error in development
        console.error('Sign in error:', error);
        message = `${message} (${error.message})`;
      }

      return new Response(
        JSON.stringify({
          error: {
            message,
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Ensure session is set (cookies are automatically set by @supabase/ssr)
    // The session object contains access_token and refresh_token
    // The SSR client's setAll callback will set cookies automatically
    if (!data.session) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to create session',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the session is properly set by getting the user
    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();

    if (!verifiedUser) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to verify session',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Sign in error:', error);
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    });
  }
};
