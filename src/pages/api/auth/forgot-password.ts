import type { APIRoute} from 'astro'
import { forgotPasswordSchema } from '@/lib/validation/auth.validation'
import { createApiErrorResponse } from '@/lib/errors/api-errors'

export const prerender = false

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json()
    
    // Validate request body
    const result = forgotPasswordSchema.safeParse(body)
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
      )
    }

    const { email } = result.data
    const supabase = locals.supabase

    // Get base URL for reset password redirect
    const redirectUrl = `${url.origin}/reset-password`

    // Request password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error && import.meta.env.DEV) {
      console.error('Forgot password error:', error)
    }

    // Always return success (security best practice - don't reveal if email exists)
    return new Response(
      JSON.stringify({
        message: 'If an account exists with this email, you will receive password reset instructions',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    })
  }
}

