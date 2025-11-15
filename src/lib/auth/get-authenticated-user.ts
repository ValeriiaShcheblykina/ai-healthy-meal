import type { APIContext } from 'astro';
import { createUnauthorizedError } from '../errors/api-errors.ts';

/**
 * Extracts the authenticated user's ID from the Authorization header.
 * Throws ApiError(401) if the token is missing or invalid.
 * Use this function in API routes that accept Bearer tokens.
 */
export async function getAuthenticatedUserId(
  context: APIContext
): Promise<string> {
  const authHeader = context.request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createUnauthorizedError();
  }

  const token = authHeader.substring('Bearer '.length);
  const supabase = context.locals.supabase;
  // Validate token via Supabase Auth API
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw createUnauthorizedError();
  }

  return data.user.id;
}

/**
 * Gets the authenticated user from context.locals (already set by middleware).
 * Returns the user object if authenticated, null otherwise.
 * Use this function in Astro pages.
 */
export function getAuthenticatedUser(context: APIContext) {
  return context.locals.user ?? null;
}
