import type { ErrorResponseDTO } from '../../types.ts';

/**
 * Standard error codes for API responses
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates a standardized error response DTO
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
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
 * Creates an UNAUTHORIZED error (401)
 */
export function createUnauthorizedError(
  message = 'Authentication required',
): ApiError {
  return new ApiError(ERROR_CODES.UNAUTHORIZED, message, 401);
}

/**
 * Creates a VALIDATION_ERROR (400)
 */
export function createValidationError(
  message = 'Invalid query parameters',
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError(
    ERROR_CODES.VALIDATION_ERROR,
    message,
    400,
    details,
  );
}

/**
 * Creates an INTERNAL_ERROR (500)
 */
export function createInternalError(
  message = 'An internal server error occurred',
): ApiError {
  return new ApiError(ERROR_CODES.INTERNAL_ERROR, message, 500);
}

/**
 * Creates a NOT_FOUND error (404)
 */
export function createNotFoundError(
  message = 'Resource not found',
): ApiError {
  return new ApiError(ERROR_CODES.NOT_FOUND, message, 404);
}

/**
 * Creates a FORBIDDEN error (403)
 */
export function createForbiddenError(
  message = 'Access denied',
): ApiError {
  return new ApiError(ERROR_CODES.FORBIDDEN, message, 403);
}

/**
 * Creates a Response object from an ApiError or error details
 */
export function createApiErrorResponse(
  error: ApiError | { statusCode: number; code: string; message: string; details?: Record<string, unknown> }
): Response {
  const statusCode = error instanceof ApiError ? error.statusCode : error.statusCode
  const body = error instanceof ApiError 
    ? createErrorResponse(error.code as ErrorCode, error.message, error.details)
    : createErrorResponse(error.code as ErrorCode, error.message, error.details)

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  })
}

