import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RecipeListResponseDTO, RecipeListQueryParams } from '@/types';

// Store mock function globally so tests can access it
declare global {
  // eslint-disable-next-line no-var
  var __mockListRecipes: ReturnType<typeof vi.fn> | undefined;
}

// Mock the RecipesClientService (vi.mock is hoisted automatically)
vi.mock('@/lib/services/client/recipes.client.service', () => {
  const mockFn = vi.fn();
  global.__mockListRecipes = mockFn;

  return {
    RecipesClientService: class {
      listRecipes = mockFn;
    },
  };
});

// Import after mock is set up
import { useRecipesQuery } from '@/components/hooks/useRecipesQuery';

describe('useRecipesQuery', () => {
  let queryClient: QueryClient;
  let mockListRecipes: ReturnType<typeof vi.fn>;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'QueryClientWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries at queryClient level
          gcTime: 0,
        },
      },
    });

    // Get the mock function from global scope
    const globalMock = global.__mockListRecipes;
    if (!globalMock) {
      throw new Error('Mock not initialized');
    }
    mockListRecipes = globalMock;
    mockListRecipes.mockClear();
  });

  describe('Query execution', () => {
    it('should execute query with provided parameters', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const mockResponse: RecipeListResponseDTO = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };

      mockListRecipes.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockListRecipes).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle successful query with data', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: 'pasta',
      };

      const mockResponse: RecipeListResponseDTO = {
        data: [
          {
            id: 'recipe-1',
            title: 'Pasta Recipe',
            content: 'Delicious pasta',
            content_json: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            is_public: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
        },
      };

      mockListRecipes.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.data).toHaveLength(1);
    });

    it('should handle query errors', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      // Use an authentication error which won't retry (per hook logic)
      const error = new Error('Authentication required');
      mockListRecipes.mockRejectedValue(error);

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      // Wait for error state - auth errors don't retry, so should fail quickly
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(
        'Authentication required'
      );
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('Caching behavior', () => {
    it('should cache query results', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const mockResponse: RecipeListResponseDTO = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };

      mockListRecipes.mockResolvedValue(mockResponse);

      const { result: result1 } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Second hook with same params should use cache
      const { result: result2 } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      // Should be successful immediately (from cache)
      expect(result2.current.isSuccess).toBe(true);
      expect(result2.current.data).toEqual(mockResponse);

      // Should only call the service once due to caching
      expect(mockListRecipes).toHaveBeenCalledTimes(1);
    });

    it('should create separate cache entries for different parameters', async () => {
      const params1: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const params2: RecipeListQueryParams = {
        page: 2,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const mockResponse1: RecipeListResponseDTO = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
      };

      const mockResponse2: RecipeListResponseDTO = {
        data: [],
        pagination: { page: 2, limit: 20, total: 0, total_pages: 0 },
      };

      mockListRecipes
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result: result1 } = renderHook(() => useRecipesQuery(params1), {
        wrapper: createWrapper(),
      });

      const { result: result2 } = renderHook(() => useRecipesQuery(params2), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(mockListRecipes).toHaveBeenCalledTimes(2);
      expect(mockListRecipes).toHaveBeenCalledWith(params1);
      expect(mockListRecipes).toHaveBeenCalledWith(params2);
    });
  });

  describe('Retry logic for auth errors', () => {
    it('should not retry on authentication errors', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const authError = new Error('Authentication required');
      mockListRecipes.mockRejectedValue(authError);

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Should only be called once (no retries)
      expect(mockListRecipes).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual(authError);
    });

    it('should identify authentication errors by message', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const authError = new Error('Authentication required');
      mockListRecipes.mockRejectedValue(authError);

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify it's an auth error
      expect(result.current.error?.message).toBe('Authentication required');
      expect(mockListRecipes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry logic for other errors', () => {
    it('should retry on network errors up to 3 times', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const networkError = new Error('Network error');
      mockListRecipes.mockRejectedValue(networkError);

      // Create a new query client with retries enabled and faster retry delay
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 10, // Fast retry for testing
            gcTime: 0,
          },
        },
      });

      const retryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: retryWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 10000,
      });

      // Should retry up to 3 times (initial + 3 retries = 4 calls)
      expect(mockListRecipes).toHaveBeenCalledTimes(4);
    }, 15000);

    it('should not retry on authentication errors even with retries enabled', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const authError = new Error('Authentication required');
      mockListRecipes.mockRejectedValue(authError);

      // Create a new query client with retries enabled
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: true,
            gcTime: 0,
          },
        },
      });

      const retryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: retryWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Should not retry auth errors
      expect(mockListRecipes).toHaveBeenCalledTimes(1);
    });

    it('should retry on generic errors', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const genericError = new Error('Server error');
      mockListRecipes.mockRejectedValue(genericError);

      // Create a new query client with retries enabled and faster retry delay
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 10, // Fast retry for testing
            gcTime: 0,
          },
        },
      });

      const retryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useRecipesQuery(params), {
        wrapper: retryWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 10000,
      });

      // Should retry (more than 1 call)
      expect(mockListRecipes).toHaveBeenCalledTimes(4);
    }, 15000);
  });

  describe('Query key generation', () => {
    it('should generate unique query keys for different parameters', async () => {
      const params1: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      };

      const params2: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'title',
        order: 'asc',
        search: 'pasta',
      };

      const mockResponse: RecipeListResponseDTO = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };

      mockListRecipes.mockResolvedValue(mockResponse);

      const { result: result1 } = renderHook(() => useRecipesQuery(params1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      const { result: result2 } = renderHook(() => useRecipesQuery(params2), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      expect(mockListRecipes).toHaveBeenCalledWith(params1);
      expect(mockListRecipes).toHaveBeenCalledWith(params2);
    });
  });
});
