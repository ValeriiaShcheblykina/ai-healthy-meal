import type {
  RecipeListQueryParams,
  RecipeVariantListQueryParams,
  CreateRecipeCommand,
  UpdateRecipeCommand,
} from '../../types.ts';
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

/**
 * Maximum length for recipe title
 */
const MAX_TITLE_LENGTH = 200;

/**
 * Maximum length for recipe content
 */
const MAX_CONTENT_LENGTH = 50000;

/**
 * Validates recipe data for create or update operations
 *
 * @param data - Raw recipe data from request
 * @param isCreate - Whether this is a create operation (true) or update (false)
 * @returns Validation result with validated data or error
 */
export function validateRecipeData(
  data: Record<string, unknown>,
  isCreate: boolean
): ValidationResult<CreateRecipeCommand | UpdateRecipeCommand> {
  const errors: Record<string, string> = {};
  const validated: Partial<CreateRecipeCommand> = {};

  // Validate title
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.title = 'must be a string';
    } else if (data.title.trim().length === 0) {
      errors.title = 'cannot be empty';
    } else if (data.title.length > MAX_TITLE_LENGTH) {
      errors.title = `must be at most ${MAX_TITLE_LENGTH} characters`;
    } else {
      validated.title = data.title.trim();
    }
  } else if (isCreate) {
    errors.title = 'is required';
  }

  // Validate content (text)
  if (data.content !== undefined && data.content !== null) {
    if (typeof data.content !== 'string') {
      errors.content = 'must be a string';
    } else if (data.content.trim().length === 0) {
      validated.content = null; // Allow null for empty content
    } else if (data.content.length > MAX_CONTENT_LENGTH) {
      errors.content = `must be at most ${MAX_CONTENT_LENGTH} characters`;
    } else {
      validated.content = data.content.trim();
    }
  } else if (isCreate && !data.content_json) {
    // For create, require at least one content field
    errors.content = 'either content or content_json is required';
  } else {
    validated.content = null;
  }

  // Validate content_json
  if (data.content_json !== undefined && data.content_json !== null) {
    // For MVP, accept any JSON object
    // In production, you'd want to validate the structure
    try {
      if (typeof data.content_json === 'object') {
        validated.content_json = data.content_json;
      } else {
        errors.content_json = 'must be a valid JSON object';
      }
    } catch {
      errors.content_json = 'must be valid JSON';
    }
  } else {
    validated.content_json = null;
  }

  // Validate is_public
  if (data.is_public !== undefined) {
    if (typeof data.is_public !== 'boolean') {
      errors.is_public = 'must be a boolean';
    } else {
      validated.is_public = data.is_public;
    }
  } else {
    validated.is_public = false; // default to private
  }

  // Ensure at least one content field is present for create
  if (
    isCreate &&
    !validated.content &&
    !validated.content_json &&
    !errors.content &&
    !errors.content_json
  ) {
    errors.content = 'either content or content_json is required';
  }

  // If there are validation errors, return error result
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      error: createValidationError('Invalid recipe data', errors),
    };
  }

  // Return success with validated data
  return {
    success: true,
    data: validated as CreateRecipeCommand | UpdateRecipeCommand,
  };
}

/**
 * Valid sort fields for recipe variant list endpoint
 */
const VALID_VARIANT_SORT_FIELDS = ['created_at'] as const;

/**
 * Validates and normalizes recipe variant list query parameters
 *
 * @param params - Raw query parameters from request
 * @returns Validation result with normalized parameters or error
 */
export function validateRecipeVariantListQueryParams(
  params: Record<string, string | undefined>
): ValidationResult<Required<RecipeVariantListQueryParams>> {
  const errors: Record<string, string> = {};
  const normalized: Partial<Required<RecipeVariantListQueryParams>> = {};

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
      !VALID_VARIANT_SORT_FIELDS.includes(
        params.sort as (typeof VALID_VARIANT_SORT_FIELDS)[number]
      )
    ) {
      errors.sort = `must be one of: ${VALID_VARIANT_SORT_FIELDS.join(', ')}`;
    } else {
      normalized.sort =
        params.sort as (typeof VALID_VARIANT_SORT_FIELDS)[number];
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
    data: normalized as Required<RecipeVariantListQueryParams>,
  };
}
