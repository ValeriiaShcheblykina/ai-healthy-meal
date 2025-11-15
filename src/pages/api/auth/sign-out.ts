import type { APIRoute } from 'astro'
import { createApiErrorResponse } from '@/lib/errors/api-errors'

export const prerender = false

export const POST: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase

    const { error } = await supabase.auth.signOut()

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Sign out error:', error)
      }

      return new Response(
        JSON.stringify({
          error: {
            message: 'Unable to sign out',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Signed out successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Sign out error:', error)
    return createApiErrorResponse({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: import.meta.env.DEV ? { error: String(error) } : undefined,
    })
  }
}

