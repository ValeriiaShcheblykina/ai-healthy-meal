import type { APIRoute } from 'astro'
import { signUpSchema } from '@/lib/validation/auth.validation'
import { createApiErrorResponse } from '@/lib/errors/api-errors'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    
    // Validate request body
    const result = signUpSchema.safeParse(body)
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

    const { email, password, displayName } = result.data
    const supabase = locals.supabase

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (error) {
      // Map Supabase errors to user-friendly messages
      let message = 'Unable to create account'
      let status = 400
      
      if (error.message.includes('already registered')) {
        message = 'An account with this email already exists'
        status = 409
      }

      if (import.meta.env.DEV) {
        // Show detailed error in development
        console.error('Sign up error:', error)
        message = `${message} (${error.message})`
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
      )
    }

    // Return success
    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: 'Account created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Sign up error:', error)
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    })
  }
}

