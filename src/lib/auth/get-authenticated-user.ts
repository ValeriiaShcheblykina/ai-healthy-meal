/**
 * @module get-authenticated-user
 * @description Authentication utility module for extracting and validating user authentication
 * in Astro API routes and pages. Provides two primary functions:
 * - Token-based authentication for API endpoints (Bearer token validation)
 * - Session-based authentication for server-rendered pages (middleware integration)
 *
 * @requires astro - Astro framework types for API context
 * @requires ../errors/api-errors - Custom API error handlers
 * @requires @supabase/supabase-js - Supabase client for authentication validation (via context.locals)
 *
 * @example
 * // In API route:
 * import { getAuthenticatedUserId } from '@/lib/auth/get-authenticated-user';
 * export async function GET(context: APIContext) {
 *   const userId = await getAuthenticatedUserId(context);
 *   // ... use userId for authenticated operations
 * }
 *
 * @example
 * // In Astro page:
 * import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user';
 * const user = getAuthenticatedUser(Astro);
 * if (!user) return Astro.redirect('/sign-in');
 */

import type { APIContext } from 'astro';
import { createUnauthorizedError } from '@/lib/errors/api-errors.ts';

/**
 * Extracts and validates the authenticated user's ID from the Authorization header or session cookie.
 *
 * This function supports both Bearer token authentication (for API clients) and session cookie
 * authentication (for browser-based requests). It automatically detects which method is being used
 * and validates accordingly.
 *
 * @async
 * @function getAuthenticatedUserId
 * @param {APIContext} context - Astro API context object containing request headers and locals
 * @param {Request} context.request - Request object with headers
 * @param {Object} context.locals - Astro locals object (must contain initialized supabase client)
 * @param {SupabaseClient} context.locals.supabase - Supabase client instance (injected by middleware)
 *
 * @returns {Promise<string>} The authenticated user's unique identifier (UUID)
 *
 * @throws {ApiError} Throws 401 UNAUTHORIZED error in the following cases:
 *   - No valid authentication method found (no Bearer token and no session cookie)
 *   - Bearer token is invalid or expired
 *   - Session cookie is invalid or expired
 *   - Token/session validation fails with Supabase
 *   - User associated with token/session doesn't exist
 *
 * @example
 * // Usage in API route
 * export async function GET(context: APIContext) {
 *   try {
 *     const userId = await getAuthenticatedUserId(context);
 *     // Proceed with authenticated operation
 *     return new Response(JSON.stringify({ userId }));
 *   } catch (error) {
 *     // Error is already formatted as ApiError with 401 status
 *     throw error;
 *   }
 * }
 *
 * @example
 * // Client-side: Making authenticated request with Bearer token
 * const response = await fetch('/api/protected-route', {
 *   headers: {
 *     'Authorization': `Bearer ${accessToken}`
 *   }
 * });
 *
 * @example
 * // Browser: Making authenticated request with session cookie (automatic)
 * const response = await fetch('/api/protected-route', {
 *   credentials: 'include'
 * });
 *
 * @see {@link createUnauthorizedError} for error structure
 * @see {@link https://supabase.com/docs/reference/javascript/auth-getuser|Supabase getUser documentation}
 */
export async function getAuthenticatedUserId(
  context: APIContext
): Promise<string> {
  const authHeader = context.request.headers.get('authorization');
  const supabase = context.locals.supabase;

  if (authHeader?.startsWith('Bearer ')) {
    // API token authentication
    const token = authHeader.substring('Bearer '.length);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw createUnauthorizedError();
    }

    return data.user.id;
  } else {
    // Session cookie authentication
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw createUnauthorizedError();
    }

    return data.user.id;
  }
}

/**
 * Retrieves the authenticated user object from the Astro context locals.
 *
 * This function is designed for Astro pages (server-side rendering) where the user
 * session has already been validated and stored in context.locals by the authentication
 * middleware. Unlike `getAuthenticatedUserId`, this function does not validate tokens
 * or make external API calls - it simply retrieves pre-validated user data.
 *
 * @function getAuthenticatedUser
 * @param {APIContext} context - Astro API context object
 * @param {Object} context.locals - Astro locals object
 * @param {User | null | undefined} context.locals.user - User object set by middleware, or null/undefined if not authenticated
 *
 * @returns {User | null} The authenticated user object if session is valid, null otherwise.
 *   User object structure depends on Supabase Auth user type.
 *
 * @example
 * // Usage in Astro page (.astro file)
 * ---
 * import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user';
 * const user = getAuthenticatedUser(Astro);
 * if (!user) {
 *   return Astro.redirect('/sign-in');
 * }
 * ---
 * <h1>Welcome, {user.email}</h1>
 *
 * @example
 * // Usage with optional rendering
 * ---
 * const user = getAuthenticatedUser(Astro);
 * ---
 * {user ? (
 *   <div>Authenticated content</div>
 * ) : (
 *   <div>Public content</div>
 * )}
 *
 * @remarks
 * - This function assumes the authentication middleware has run and populated context.locals.user
 * - Returns null (not throwing error) to allow flexible handling in pages
 * - For API routes requiring authentication, use `getAuthenticatedUserId` instead
 * - The middleware should be configured in src/middleware/index.ts
 *
 * @see {@link file://./src/middleware/index.ts} for middleware implementation
 */
export function getAuthenticatedUser(context: APIContext) {
  return context.locals.user ?? null;
}
