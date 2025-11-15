import type { RecipeListQueryParams } from '../../types.ts';
import { createValidationError } from '../errors/api-errors.ts';

/**
 * Valid sort fields for recipe list endpoint
 */
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'title'] as const;

/**
 * Valid order values
 */
const VALID_ORDERS = ['asc', 'desc'] as const;

/**
 * Maximum length for search query string
 */
const MAX_SEARCH_LENGTH = 200;

/**
 * Validation result for query parameters
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ReturnType<typeof createValidationError> };

/**
 * Validates and normalizes recipe list query parameters
 *
 * @param params - Raw query parameters from request
 * @returns Validation result with normalized parameters or error
 */
export function validateRecipeListQueryParams(
  params: Record<string, string | undefined>
): ValidationResult<Required<RecipeListQueryParams>> {
  const errors: Record<string, string> = {};
  const normalized: Partial<Required<RecipeListQueryParams>> = {};

  // Validate and normalize page
  if (params.page !== undefined) {
    const page = parseInt(params.page, 10);
    if (isNaN(page) || page < 1) {
      errors.page = 'must be a positive integer';
    } else {
      normalized.page = page;
    }
  } else {
    normalized.page = 1; // default
  }

  // Validate and normalize limit
  if (params.limit !== undefined) {
    const limit = parseInt(params.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.limit = 'must be between 1 and 100';
    } else {
      normalized.limit = limit;
    }
  } else {
    normalized.limit = 20; // default
  }

  // Validate and normalize sort
  if (params.sort !== undefined) {
    if (
      !VALID_SORT_FIELDS.includes(
        params.sort as (typeof VALID_SORT_FIELDS)[number]
      )
    ) {
      errors.sort = `must be one of: ${VALID_SORT_FIELDS.join(', ')}`;
    } else {
      normalized.sort = params.sort as (typeof VALID_SORT_FIELDS)[number];
    }
  } else {
    normalized.sort = 'created_at'; // default
  }

  // Validate and normalize order
  if (params.order !== undefined) {
    if (!VALID_ORDERS.includes(params.order as (typeof VALID_ORDERS)[number])) {
      errors.order = `must be one of: ${VALID_ORDERS.join(', ')}`;
    } else {
      normalized.order = params.order as (typeof VALID_ORDERS)[number];
    }
  } else {
    normalized.order = 'desc'; // default
  }

  // Validate and normalize search
  if (params.search !== undefined && params.search !== '') {
    const search = params.search.trim();
    if (search.length > MAX_SEARCH_LENGTH) {
      errors.search = `must be at most ${MAX_SEARCH_LENGTH} characters`;
    } else {
      normalized.search = search;
    }
  } else {
    normalized.search = ''; // default to empty string
  }

  // If there are validation errors, return error result
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      error: createValidationError('Invalid query parameters', errors),
    };
  }

  // Return success with normalized, required parameters
  return {
    success: true,
    data: normalized as Required<RecipeListQueryParams>,
  };
}
