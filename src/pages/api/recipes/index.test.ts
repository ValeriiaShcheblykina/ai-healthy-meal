import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './index';
import {
  createMockAPIContext,
  getResponseJson,
} from '../../../../test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '../../../../test/mocks/supabase.mock';
import * as getAuthenticatedUserModule from '@/lib/auth/get-authenticated-user';

// Mock the getAuthenticatedUserId function
vi.mock('@/lib/auth/get-authenticated-user', () => ({
  getAuthenticatedUserId: vi.fn(),
}));

// Mock RecipeService
const mockListRecipes = vi.fn();
const mockCreateRecipe = vi.fn();

vi.mock('@/lib/services/recipe.service', () => ({
  RecipeService: {},
}));

describe('GET /api/recipes', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should return recipes list with default pagination', async () => {
    const mockResponse = {
      data: [
        {
          id: 'recipe-1',
          title: 'Test Recipe',
          content: 'Recipe content',
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

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(mockListRecipes).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sort: 'created_at',
      order: 'desc',
      search: '',
    });
  });

  it('should handle query parameters correctly', async () => {
    const mockResponse = {
      data: [],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        total_pages: 3,
      },
    };

    mockListRecipes.mockResolvedValue(mockResponse);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes?page=2&limit=10&search=pasta&sort=title&order=asc',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(mockListRecipes).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      sort: 'title',
      order: 'asc',
      search: 'pasta',
    });
  });

  it('should return 400 for invalid query parameters', async () => {
    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes?page=0&limit=200&sort=invalid',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockRejectedValue(new Error('Unauthorized'));

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should handle service errors', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    mockListRecipes.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('INTERNAL_ERROR');
    }
  });
});

describe('POST /api/recipes', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should successfully create a new recipe', async () => {
    const mockRecipe = {
      id: 'new-recipe-id',
      title: 'New Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockCreateRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes',
      body: {
        title: 'New Recipe',
        content: 'Recipe content',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json && typeof json === 'object').toBe(true);
    if (json && typeof json === 'object') {
      const recipeJson = json as typeof mockRecipe;
      expect(recipeJson.id).toBe(mockRecipe.id);
      expect(recipeJson.title).toBe(mockRecipe.title);
    }
    expect(mockCreateRecipe).toHaveBeenCalledWith('test-user-id', {
      title: 'New Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
    });
  });

  it('should return 400 for invalid request body', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes',
      body: {
        title: '', // Empty title
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it('should return 400 when title is missing', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes',
      body: {
        content: 'Recipe content without title',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it('should handle recipe with content_json', async () => {
    const mockRecipe = {
      id: 'new-recipe-id',
      title: 'New Recipe',
      content: null,
      content_json: { ingredients: ['flour', 'eggs'], steps: ['Mix', 'Bake'] },
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockCreateRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes',
      body: {
        title: 'New Recipe',
        content_json: {
          ingredients: ['flour', 'eggs'],
          steps: ['Mix', 'Bake'],
        },
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    if (json && typeof json === 'object') {
      const recipeJson = json as { title: string; content_json: unknown };
      expect(recipeJson.title).toBe('New Recipe');
      expect(recipeJson.content_json).toEqual(mockRecipe.content_json);
    }
  });

  it('should handle service errors', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    mockCreateRecipe.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes',
      body: {
        title: 'New Recipe',
        content: 'Recipe content',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('INTERNAL_ERROR');
    }
  });

  it('should handle invalid JSON in request body', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes',
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
      supabase: mockSupabase,
    });

    // Override request to have invalid JSON
    context.request = new Request(context.request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
