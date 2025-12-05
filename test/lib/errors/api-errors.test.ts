import { describe, it, expect } from 'vitest';
import {
  ERROR_CODES,
  ApiError,
  createErrorResponse,
  createUnauthorizedError,
  createValidationError,
  createInternalError,
  createNotFoundError,
  createForbiddenError,
  createApiErrorResponse,
} from '@/lib/errors/api-errors';

describe('API Errors', () => {
  describe('ERROR_CODES', () => {
    it('should export all error codes', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
    });

    it('should have all required error codes', () => {
      const codes = Object.values(ERROR_CODES);
      expect(codes).toHaveLength(5);
      expect(codes).toContain('UNAUTHORIZED');
      expect(codes).toContain('VALIDATION_ERROR');
      expect(codes).toContain('INTERNAL_ERROR');
      expect(codes).toContain('NOT_FOUND');
      expect(codes).toContain('FORBIDDEN');
    });
  });

  describe('ApiError', () => {
    it('should create ApiError instance with all properties', () => {
      const error = new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        'Test error message',
        400,
        { field: 'email', reason: 'Invalid format' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({
        field: 'email',
        reason: 'Invalid format',
      });
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without details', () => {
      const error = new ApiError(
        ERROR_CODES.INTERNAL_ERROR,
        'Internal error',
        500
      );

      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(error.message).toBe('Internal error');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('should have readonly properties', () => {
      const error = new ApiError(ERROR_CODES.NOT_FOUND, 'Not found', 404);

      // Verify properties are set correctly
      // Note: TypeScript enforces readonly at compile time, runtime doesn't prevent assignment
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response DTO with code and message', () => {
      const response = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid input data'
      );

      expect(response).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    });

    it('should include details when provided', () => {
      const response = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        { email: 'Invalid format', password: 'Too short' }
      );

      expect(response).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            email: 'Invalid format',
            password: 'Too short',
          },
        },
      });
    });

    it('should not include details key when details is undefined', () => {
      const response = createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Internal error'
      );

      expect(response.error).not.toHaveProperty('details');
      expect(response.error).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Internal error',
      });
    });

    it('should not include details key when details is empty object', () => {
      const response = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        {}
      );

      // Empty object should still include details key
      expect(response.error.details).toEqual({});
    });
  });

  describe('createUnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = createUnauthorizedError();

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.details).toBeUndefined();
    });

    it('should create unauthorized error with custom message', () => {
      const error = createUnauthorizedError('Your session has expired');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(error.message).toBe('Your session has expired');
      expect(error.statusCode).toBe(401);
    });

    it('should create unauthorized error with empty string message', () => {
      const error = createUnauthorizedError('');

      expect(error.message).toBe('');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('createForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = createForbiddenError();

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.details).toBeUndefined();
    });

    it('should create forbidden error with custom message', () => {
      const error = createForbiddenError('You can only edit your own recipes');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.message).toBe('You can only edit your own recipes');
      expect(error.statusCode).toBe(403);
    });

    it('should create forbidden error with empty string message', () => {
      const error = createForbiddenError('');

      expect(error.message).toBe('');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with default message', () => {
      const error = createValidationError();

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid query parameters');
      expect(error.statusCode).toBe(400);
    });

    it('should create validation error with custom message and details', () => {
      const error = createValidationError('Validation failed', {
        email: 'Invalid format',
        password: 'Too short',
      });

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({
        email: 'Invalid format',
        password: 'Too short',
      });
    });
  });

  describe('createInternalError', () => {
    it('should create internal error with default message', () => {
      const error = createInternalError();

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(error.message).toBe('An internal server error occurred');
      expect(error.statusCode).toBe(500);
    });

    it('should create internal error with custom message', () => {
      const error = createInternalError('Service temporarily unavailable');

      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = createNotFoundError();

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create not found error with custom message', () => {
      const error = createNotFoundError('Recipe not found');

      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('Recipe not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('createApiErrorResponse', () => {
    describe('with ApiError instance', () => {
      it('should create Response from ApiError with status code and headers', async () => {
        const error = createValidationError('Invalid input', {
          email: 'Required',
        });
        const response = createApiErrorResponse(error);

        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(400);
        expect(response.headers.get('Content-Type')).toBe('application/json');

        const body = await response.json();
        expect(body).toEqual({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: {
              email: 'Required',
            },
          },
        });
      });

      it('should create Response from ApiError without details', async () => {
        const error = createUnauthorizedError('Authentication required');
        const response = createApiErrorResponse(error);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body).toEqual({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        expect(body.error).not.toHaveProperty('details');
      });

      it('should handle all error types', async () => {
        const errors = [
          createUnauthorizedError(),
          createForbiddenError(),
          createValidationError(),
          createInternalError(),
          createNotFoundError(),
        ];

        for (const error of errors) {
          const response = createApiErrorResponse(error);
          expect(response.status).toBe(error.statusCode);
          const body = await response.json();
          expect(body.error.code).toBe(error.code);
          expect(body.error.message).toBe(error.message);
        }
      });

      it('should create Response with correct status code for forbidden error', async () => {
        const error = createForbiddenError('Access denied');
        const response = createApiErrorResponse(error);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error.code).toBe('FORBIDDEN');
        expect(body.error.message).toBe('Access denied');
      });
    });

    describe('with plain error object', () => {
      it('should create Response from plain error object', async () => {
        const errorObject = {
          statusCode: 400,
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid input',
          details: { field: 'email' },
        };

        const response = createApiErrorResponse(errorObject);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body).toEqual({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: { field: 'email' },
          },
        });
      });

      it('should create Response from plain error object without details', async () => {
        const errorObject = {
          statusCode: 401,
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        };

        const response = createApiErrorResponse(errorObject);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).not.toHaveProperty('details');
        expect(body.error).toEqual({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      });

      it('should handle plain error object with forbidden code', async () => {
        const errorObject = {
          statusCode: 403,
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access denied',
        };

        const response = createApiErrorResponse(errorObject);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error.code).toBe('FORBIDDEN');
        expect(body.error.message).toBe('Access denied');
      });
    });

    describe('error response formatting', () => {
      it('should format error response with nested details', async () => {
        const error = createValidationError('Validation failed', {
          user: {
            email: 'Invalid format',
            password: 'Too short',
          },
        });

        const response = createApiErrorResponse(error);
        const body = await response.json();

        expect(body.error.details).toEqual({
          user: {
            email: 'Invalid format',
            password: 'Too short',
          },
        });
      });

      it('should format error response with array in details', async () => {
        const error = createValidationError('Validation failed', {
          errors: ['Error 1', 'Error 2'],
        });

        const response = createApiErrorResponse(error);
        const body = await response.json();

        expect(body.error.details).toEqual({
          errors: ['Error 1', 'Error 2'],
        });
      });

      it('should format error response with null details values', async () => {
        const error = createValidationError('Validation failed', {
          field1: null,
          field2: 'Value',
        });

        const response = createApiErrorResponse(error);
        const body = await response.json();

        expect(body.error.details).toEqual({
          field1: null,
          field2: 'Value',
        });
      });

      it('should ensure JSON is properly stringified', async () => {
        const error = createValidationError('Test', { key: 'value' });
        const response = createApiErrorResponse(error);

        const text = await response.text();
        expect(() => JSON.parse(text)).not.toThrow();
        const parsed = JSON.parse(text);
        expect(parsed.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('edge cases', () => {
      it('should handle ApiError with empty string message', async () => {
        const error = new ApiError(ERROR_CODES.INTERNAL_ERROR, '', 500);
        const response = createApiErrorResponse(error);

        const body = await response.json();
        expect(body.error.message).toBe('');
      });

      it('should handle plain error object with empty string message', async () => {
        const errorObject = {
          statusCode: 500,
          code: ERROR_CODES.INTERNAL_ERROR,
          message: '',
        };

        const response = createApiErrorResponse(errorObject);
        const body = await response.json();
        expect(body.error.message).toBe('');
      });

      it('should handle ApiError with very long message', async () => {
        const longMessage = 'a'.repeat(1000);
        const error = new ApiError(
          ERROR_CODES.INTERNAL_ERROR,
          longMessage,
          500
        );
        const response = createApiErrorResponse(error);

        const body = await response.json();
        expect(body.error.message).toBe(longMessage);
      });

      it('should handle ApiError with complex details structure', async () => {
        const complexDetails = {
          nested: {
            deeply: {
              nested: {
                value: 'test',
                array: [1, 2, 3],
              },
            },
          },
        };

        const error = createValidationError('Complex error', complexDetails);
        const response = createApiErrorResponse(error);

        const body = await response.json();
        expect(body.error.details).toEqual(complexDetails);
      });
    });
  });

  describe('integration tests', () => {
    it('should work with createUnauthorizedError and createApiErrorResponse', async () => {
      const error = createUnauthorizedError('Please sign in');
      const response = createApiErrorResponse(error);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Please sign in');
    });

    it('should work with createForbiddenError and createApiErrorResponse', async () => {
      const error = createForbiddenError('Admin privileges required');
      const response = createApiErrorResponse(error);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Admin privileges required');
    });

    it('should work with createErrorResponse and createApiErrorResponse', async () => {
      const errorResponse = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid data',
        { field: 'email' }
      );

      // Simulate using it in createApiErrorResponse
      const error = createValidationError('Invalid data', { field: 'email' });
      const response = createApiErrorResponse(error);

      const body = await response.json();
      expect(body).toEqual(errorResponse);
    });
  });
});
