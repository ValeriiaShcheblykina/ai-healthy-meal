/**
 * @module api-errors
 * @description Centralized error handling module for API responses. Provides standardized
 * error structures, error codes, and factory functions for creating consistent error responses
 * across the application. This module ensures that all API errors follow a uniform format
 * and include appropriate HTTP status codes.
 *
 * @requires ../../types - ErrorResponseDTO type definition
 *
 * Key Features:
 * - Type-safe error codes with TypeScript const assertion
 * - Custom ApiError class extending native Error
 * - Factory functions for common HTTP error scenarios
 * - Standardized error response format
 * - Automatic Response object creation with proper headers
 *
 * @example
 * // In an API route
 * import { createUnauthorizedError, createApiErrorResponse } from '@/lib/errors/api-errors';
 *
 * export async function GET(context: APIContext) {
 *   if (!isAuthenticated) {
 *     const error = createUnauthorizedError('Please sign in');
 *     return createApiErrorResponse(error);
 *   }
 * }
 */

import type { ErrorResponseDTO } from '@/types.ts';

/**
 * Standard error codes for API responses.
 *
 * This constant object defines all possible error codes used throughout the application.
 * Using a const assertion ensures type safety and prevents accidental modifications.
 *
 * @constant {Object} ERROR_CODES
 * @property {string} UNAUTHORIZED - Authentication is required but missing or invalid (401)
 * @property {string} VALIDATION_ERROR - Request data failed validation (400)
 * @property {string} INTERNAL_ERROR - Unexpected server error occurred (500)
 * @property {string} NOT_FOUND - Requested resource does not exist (404)
 * @property {string} FORBIDDEN - User lacks permission for the requested resource (403)
 *
 * @example
 * import { ERROR_CODES } from '@/lib/errors/api-errors';
 * if (error.code === ERROR_CODES.UNAUTHORIZED) {
 *   // Handle unauthorized access
 * }
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const;

/**
 * Type-safe union of all possible error codes.
 * Automatically derived from ERROR_CODES constant.
 *
 * @typedef {string} ErrorCode
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Custom error class for API errors with structured error information.
 *
 * Extends the native Error class to include additional properties required for
 * generating standardized API error responses. All properties are readonly to
 * prevent accidental modifications after instantiation.
 *
 * @class ApiError
 * @extends {Error}
 *
 * @property {ErrorCode} code - Standardized error code from ERROR_CODES
 * @property {string} message - Human-readable error message
 * @property {number} statusCode - HTTP status code (e.g., 400, 401, 404, 500)
 * @property {Record<string, unknown>} [details] - Optional additional error context (e.g., validation errors)
 * @property {string} name - Error name, always set to 'ApiError'
 *
 * @example
 * // Direct instantiation (usually not needed, use factory functions instead)
 * const error = new ApiError(
 *   ERROR_CODES.VALIDATION_ERROR,
 *   'Invalid email format',
 *   400,
 *   { field: 'email', reason: 'Must be a valid email address' }
 * );
 *
 * @example
 * // Catching and handling ApiError
 * try {
 *   await someOperation();
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`API Error [${error.code}]: ${error.message}`);
 *     return createApiErrorResponse(error);
 *   }
 * }
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates a standardized error response DTO conforming to the API contract.
 *
 * This function transforms error information into a consistent JSON structure
 * that matches the ErrorResponseDTO type. All API error responses should use
 * this format to ensure client-side error handling is predictable.
 *
 * @function createErrorResponse
 * @param {ErrorCode} code - Standardized error code from ERROR_CODES
 * @param {string} message - Human-readable error description
 * @param {Record<string, unknown>} [details] - Optional additional error information (e.g., field-level validation errors)
 *
 * @returns {ErrorResponseDTO} Structured error response object with 'error' wrapper
 *
 * @example
 * const errorResponse = createErrorResponse(
 *   ERROR_CODES.VALIDATION_ERROR,
 *   'Invalid input data',
 *   { email: 'Invalid format', password: 'Too short' }
 * );
 * // Returns:
 * // {
 * //   error: {
 * //     code: 'VALIDATION_ERROR',
 * //     message: 'Invalid input data',
 * //     details: { email: 'Invalid format', password: 'Too short' }
 * //   }
 * // }
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponseDTO {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Creates an UNAUTHORIZED error (HTTP 401) for authentication failures.
 *
 * Use this factory function when a user attempts to access a protected resource
 * without valid authentication credentials, or when their session/token has expired.
 *
 * @function createUnauthorizedError
 * @param {string} [message='Authentication required'] - Custom error message
 *
 * @returns {ApiError} ApiError instance with UNAUTHORIZED code and 401 status
 *
 * @example
 * // With default message
 * throw createUnauthorizedError();
 *
 * @example
 * // With custom message
 * throw createUnauthorizedError('Your session has expired');
 *
 * @example
 * // In API route
 * if (!token) {
 *   return createApiErrorResponse(createUnauthorizedError());
 * }
 */
export function createUnauthorizedError(
  message = 'Authentication required'
): ApiError {
  return new ApiError(ERROR_CODES.UNAUTHORIZED, message, 401);
}

/**
 * Creates a VALIDATION_ERROR (HTTP 400) for request validation failures.
 *
 * Use this factory function when client-provided data fails validation rules.
 * The optional details parameter is useful for providing field-specific error messages.
 *
 * @function createValidationError
 * @param {string} [message='Invalid query parameters'] - General validation error message
 * @param {Record<string, unknown>} [details] - Field-level validation errors or additional context
 *
 * @returns {ApiError} ApiError instance with VALIDATION_ERROR code and 400 status
 *
 * @example
 * // Simple validation error
 * throw createValidationError('Invalid request body');
 *
 * @example
 * // With field-specific details
 * throw createValidationError('Validation failed', {
 *   email: 'Must be a valid email address',
 *   password: 'Must be at least 8 characters',
 *   age: 'Must be a positive number'
 * });
 *
 * @example
 * // In API route with Zod validation
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   throw createValidationError('Invalid data', result.error.flatten());
 * }
 */
export function createValidationError(
  message = 'Invalid query parameters',
  details?: Record<string, unknown>
): ApiError {
  return new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
}

/**
 * Creates an INTERNAL_ERROR (HTTP 500) for unexpected server errors.
 *
 * Use this factory function when an unexpected error occurs on the server side,
 * such as database failures, external API errors, or unhandled exceptions.
 * Avoid exposing sensitive error details to clients.
 *
 * @function createInternalError
 * @param {string} [message='An internal server error occurred'] - Generic error message
 *
 * @returns {ApiError} ApiError instance with INTERNAL_ERROR code and 500 status
 *
 * @example
 * // Database error handling
 * try {
 *   await db.query(sql);
 * } catch (error) {
 *   console.error('Database error:', error); // Log detailed error server-side
 *   throw createInternalError(); // Return generic message to client
 * }
 *
 * @example
 * // Custom error message
 * throw createInternalError('Service temporarily unavailable');
 *
 * @remarks
 * IMPORTANT: Never expose internal error details (stack traces, database errors, etc.)
 * to clients in production. Always log detailed errors server-side for debugging.
 */
export function createInternalError(
  message = 'An internal server error occurred'
): ApiError {
  return new ApiError(ERROR_CODES.INTERNAL_ERROR, message, 500);
}

/**
 * Creates a NOT_FOUND error (HTTP 404) for missing resources.
 *
 * Use this factory function when a requested resource (e.g., user, recipe, post)
 * does not exist in the database or has been deleted.
 *
 * @function createNotFoundError
 * @param {string} [message='Resource not found'] - Description of the missing resource
 *
 * @returns {ApiError} ApiError instance with NOT_FOUND code and 404 status
 *
 * @example
 * // Generic not found
 * throw createNotFoundError();
 *
 * @example
 * // Specific resource
 * const recipe = await db.recipes.findById(id);
 * if (!recipe) {
 *   throw createNotFoundError('Recipe not found');
 * }
 *
 * @example
 * // In API route
 * export async function GET(context: APIContext) {
 *   const { id } = context.params;
 *   const user = await getUser(id);
 *   if (!user) {
 *     return createApiErrorResponse(createNotFoundError(`User ${id} not found`));
 *   }
 * }
 */
export function createNotFoundError(message = 'Resource not found'): ApiError {
  return new ApiError(ERROR_CODES.NOT_FOUND, message, 404);
}

/**
 * Creates a FORBIDDEN error (HTTP 403) for authorization failures.
 *
 * Use this factory function when an authenticated user attempts to access a resource
 * they don't have permission to access. Unlike 401 (UNAUTHORIZED), this indicates
 * the user is authenticated but lacks sufficient privileges.
 *
 * @function createForbiddenError
 * @param {string} [message='Access denied'] - Description of the access restriction
 *
 * @returns {ApiError} ApiError instance with FORBIDDEN code and 403 status
 *
 * @example
 * // Basic forbidden error
 * throw createForbiddenError();
 *
 * @example
 * // Custom message
 * const recipe = await getRecipe(id);
 * if (recipe.userId !== currentUserId) {
 *   throw createForbiddenError('You can only edit your own recipes');
 * }
 *
 * @example
 * // Role-based access control
 * if (!user.isAdmin) {
 *   throw createForbiddenError('Admin privileges required');
 * }
 *
 * @remarks
 * Distinction between 401 and 403:
 * - 401 UNAUTHORIZED: No valid authentication credentials
 * - 403 FORBIDDEN: Valid credentials but insufficient permissions
 */
export function createForbiddenError(message = 'Access denied'): ApiError {
  return new ApiError(ERROR_CODES.FORBIDDEN, message, 403);
}

/**
 * Creates a standard Response object from an ApiError or error-like object.
 *
 * This function converts ApiError instances into HTTP Response objects suitable
 * for returning from API routes. It automatically sets the correct status code,
 * content-type header, and formats the response body according to the ErrorResponseDTO schema.
 *
 * @function createApiErrorResponse
 * @param {ApiError | Object} error - ApiError instance or error-like object
 * @param {number} error.statusCode - HTTP status code
 * @param {string} error.code - Error code from ERROR_CODES
 * @param {string} error.message - Human-readable error message
 * @param {Record<string, unknown>} [error.details] - Optional additional error context
 *
 * @returns {Response} Response object with JSON error body, appropriate status code, and Content-Type header
 *
 * @example
 * // In API route - using factory function
 * export async function DELETE(context: APIContext) {
 *   try {
 *     const userId = await getAuthenticatedUserId(context);
 *     await deleteUser(userId);
 *     return new Response(null, { status: 204 });
 *   } catch (error) {
 *     if (error instanceof ApiError) {
 *       return createApiErrorResponse(error);
 *     }
 *     return createApiErrorResponse(createInternalError());
 *   }
 * }
 *
 * @example
 * // Direct usage
 * const error = createValidationError('Invalid email', { email: 'Required' });
 * return createApiErrorResponse(error);
 * // Returns Response with:
 * // - status: 400
 * // - headers: { 'Content-Type': 'application/json' }
 * // - body: { error: { code: 'VALIDATION_ERROR', message: 'Invalid email', details: {...} } }
 *
 * @example
 * // Using with custom error object (not recommended, prefer ApiError)
 * return createApiErrorResponse({
 *   statusCode: 400,
 *   code: ERROR_CODES.VALIDATION_ERROR,
 *   message: 'Invalid input',
 *   details: { field: 'email' }
 * });
 */
export function createApiErrorResponse(
  error:
    | ApiError
    | {
        statusCode: number;
        code: string;
        message: string;
        details?: Record<string, unknown>;
      }
): Response {
  const statusCode =
    error instanceof ApiError ? error.statusCode : error.statusCode;
  const body =
    error instanceof ApiError
      ? createErrorResponse(
          error.code as ErrorCode,
          error.message,
          error.details
        )
      : createErrorResponse(
          error.code as ErrorCode,
          error.message,
          error.details
        );

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
