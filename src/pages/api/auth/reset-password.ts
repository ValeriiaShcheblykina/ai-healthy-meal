import type { APIRoute } from 'astro';
import { resetPasswordSchema } from '@/lib/validation/auth.validation';
import { createApiErrorResponse } from '@/lib/errors/api-errors';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body (token not validated by zod, just password)
    const result = resetPasswordSchema.safeParse({
      password: body.password,
      confirmPassword: body.confirmPassword,
    });

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

    const { password } = result.data;
    const supabase = locals.supabase;

    // Update password (user must be authenticated via password reset token)
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      let message = 'Unable to reset password';
      let status = 400;

      if (error.message.includes('token')) {
        message = 'Invalid or expired reset link. Please request a new one';
        status = 401;
      }

      if (import.meta.env.DEV) {
        console.error('Reset password error:', error);
        message = `${message} (${error.message})`;
      }

      return new Response(
        JSON.stringify({
          error: {
            message,
          },
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Password reset successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    });
  }
};
