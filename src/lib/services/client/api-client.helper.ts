/**
 * @module api-client.helper
 * @description Helper utilities for client-side API calls.
 * Provides common functionality for making authenticated API requests,
 * handling errors, and managing authentication redirects.
 */

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export interface ApiErrorOptions {
  defaultMessage: string;
  notFoundMessage?: string;
}

/**
 * Handles authentication errors by redirecting to sign-in page.
 *
 * @private
 * @param {number} status - HTTP status code
 */
function handleAuthError(status: number): void {
  if (status === 401 || status === 403) {
    window.location.href = '/sign-in';
    throw new Error('Authentication required');
  }
}

/**
 * Extracts error message from API error response.
 *
 * @private
 * @param {Response} response - Fetch Response object
 * @returns {Promise<string>} Error message
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData?.error?.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

/**
 * Makes an authenticated API request with consistent error handling.
 *
 * @async
 * @function fetchApi
 * @param {string} url - API endpoint URL
 * @param {FetchOptions} options - Fetch options (method, body, etc.)
 * @param {ApiErrorOptions} errorOptions - Error message options
 * @returns {Promise<T>} Parsed JSON response
 *
 * @throws {Error} If request fails, with appropriate error message
 *
 * @example
 * const data = await fetchApi<RecipeListResponseDTO>(
 *   '/api/recipes',
 *   { method: 'GET' },
 *   { defaultMessage: 'Failed to fetch recipes' }
 * );
 */
export async function fetchApi<T>(
  url: string,
  options: FetchOptions = {},
  errorOptions: ApiErrorOptions
): Promise<T> {
  const { body, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Handle authentication errors
    handleAuthError(response.status);

    // Handle not found errors
    if (response.status === 404 && errorOptions.notFoundMessage) {
      throw new Error(errorOptions.notFoundMessage);
    }

    // Extract and throw error message
    const errorMessage = await extractErrorMessage(response);
    throw new Error(errorMessage || errorOptions.defaultMessage);
  }

  return response.json();
}
