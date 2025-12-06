/**
 * @module parse-request-body
 * @description Utility module for safely parsing JSON request bodies in API routes.
 * Provides consistent error handling for malformed JSON requests.
 *
 * @requires ../errors/api-errors - Validation error factory
 *
 * @example
 * import { parseJsonBody } from '@/lib/api/parse-request-body';
 *
 * export async function POST(context: APIContext) {
 *   const body = await parseJsonBody(context.request);
 *   // Use body...
 * }
 */

import { createValidationError } from '@/lib/errors/api-errors';

/**
 * Safely parses a JSON request body with consistent error handling.
 *
 * This function attempts to parse the request body as JSON and throws a
 * standardized validation error if parsing fails. This ensures all API
 * endpoints handle malformed JSON requests consistently.
 *
 * @async
 * @function parseJsonBody
 * @param {Request} request - Fetch Request object with JSON body
 * @returns {Promise<unknown>} Parsed JSON body (type should be validated separately)
 *
 * @throws {ApiError} Throws VALIDATION_ERROR (400) if:
 *   - Request body is not valid JSON
 *   - JSON parsing fails for any reason
 *
 * @example
 * // Basic usage
 * const body = await parseJsonBody(request);
 *
 * @example
 * // With type validation
 * const rawBody = await parseJsonBody(request);
 * const result = schema.safeParse(rawBody);
 * if (!result.success) {
 *   throw createValidationError('Invalid data', result.error.format());
 * }
 */
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw createValidationError('Invalid JSON in request body');
  }
}
