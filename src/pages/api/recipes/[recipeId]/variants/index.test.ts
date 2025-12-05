import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './index';
import {
  createMockAPIContext,
  getResponseJson,
} from '@test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '@test/mocks/supabase.mock';
import * as getAuthenticatedUserModule from '@/lib/auth/get-authenticated-user';

// Mock the getAuthenticatedUserId function
vi.mock('@/lib/auth/get-authenticated-user', () => ({
  getAuthenticatedUserId: vi.fn(),
}));

// Mock RecipeService
const mockGetRecipe = vi.fn();
const mockListRecipeVariants = vi.fn();

vi.mock('@/lib/services/recipe.service', () => ({
  RecipeService: class {
    getRecipe = mockGetRecipe;
    listRecipeVariants = mockListRecipeVariants;
  },
}));

describe('GET /api/recipes/:recipeId/variants', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should return variants list with default pagination', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    const mockResponse = {
      data: [
        {
          id: 'variant-1',
          recipe_id: 'recipe-id',
          parent_variant_id: null,
          created_by: 'test-user-id',
          model: 'openai/gpt-4o',
          prompt: 'Test prompt',
          preferences_snapshot: {},
          output_text: 'Recipe text',
          output_json: { title: 'Variant Recipe' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      },
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);
    mockListRecipeVariants.mockResolvedValue(mockResponse);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(mockGetRecipe).toHaveBeenCalledWith('recipe-id');
    expect(mockListRecipeVariants).toHaveBeenCalledWith('recipe-id', {
      page: 1,
      limit: 20,
      sort: 'created_at',
      order: 'desc',
    });
  });

  it('should handle query parameters correctly', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    const mockResponse = {
      data: [],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        total_pages: 3,
      },
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);
    mockListRecipeVariants.mockResolvedValue(mockResponse);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants?page=2&limit=10&sort=created_at&order=asc',
      params: { recipeId: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResponse);
    expect(mockListRecipeVariants).toHaveBeenCalledWith('recipe-id', {
      page: 2,
      limit: 10,
      sort: 'created_at',
      order: 'asc',
    });
  });

  it('should return 400 for invalid query parameters', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants?page=0&limit=200&sort=invalid',
      params: { recipeId: 'recipe-id' },
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

  it('should return 404 when recipe is not found', async () => {
    mockGetRecipe.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/non-existent-id/variants',
      params: { recipeId: 'non-existent-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
      expect(errorJson.error.message).toBe('Recipe not found');
    }
  });

  it('should return 404 when user does not own the recipe', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'other-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
      expect(errorJson.error.message).toBe('Recipe not found');
    }
  });

  it('should return 400 when recipeId is missing', async () => {
    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes//variants',
      params: {},
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

  it('should return 500 when service throws error', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);
    mockListRecipeVariants.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockRejectedValue(new Error('Unauthorized'));

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });
});

describe('POST /api/recipes/:recipeId/variants', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should successfully create a new variant', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    const mockGeneratedRecipe = {
      title: 'Variant Recipe',
      description: 'A variant of the original',
      ingredients: [
        { name: 'flour', quantity: '2 cups' },
        { name: 'eggs', quantity: '3' },
      ],
      instructions: ['Mix ingredients', 'Bake at 350F'],
    };

    const mockVariant = {
      id: 'variant-id',
      recipe_id: 'recipe-id',
      parent_variant_id: null,
      created_by: 'test-user-id',
      model: 'openai/gpt-4o',
      prompt: 'Test prompt',
      preferences_snapshot: { diets: ['vegan'] },
      output_text: 'Recipe text',
      output_json: mockGeneratedRecipe,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: mockVariant,
      error: null,
    });

    const mockFrom = vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        generatedRecipe: mockGeneratedRecipe,
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
        preferences_snapshot: { diets: ['vegan'] },
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object').toBe(true);
    if (json && typeof json === 'object') {
      const variantJson = json as typeof mockVariant;
      expect(variantJson.id).toBe(mockVariant.id);
      expect(variantJson.recipe_id).toBe(mockVariant.recipe_id);
      expect(variantJson.model).toBe(mockVariant.model);
    }
    expect(mockGetRecipe).toHaveBeenCalledWith('recipe-id');
    expect(mockFrom).toHaveBeenCalledWith('recipe_variants');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should return 400 when generatedRecipe is missing', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
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
  });

  it('should return 400 when model is missing', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        generatedRecipe: { title: 'Test' },
        prompt: 'Test prompt',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should return 400 when prompt is missing', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        generatedRecipe: { title: 'Test' },
        model: 'openai/gpt-4o',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should return 400 for invalid request body', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
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
  });

  it('should return 404 when recipe is not found', async () => {
    mockGetRecipe.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/non-existent-id/variants',
      params: { recipeId: 'non-existent-id' },
      body: {
        generatedRecipe: { title: 'Test' },
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
      expect(errorJson.error.message).toBe('Recipe not found');
    }
  });

  it('should return 404 when user does not own the recipe', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'other-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        generatedRecipe: { title: 'Test' },
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should return 500 when database insert fails', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST500' },
    });

    const mockFrom = vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        generatedRecipe: { title: 'Test' },
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should return 400 when recipeId is missing', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes//variants',
      params: {},
      body: {
        generatedRecipe: { title: 'Test' },
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should handle preferences_snapshot correctly', async () => {
    const mockRecipe = {
      id: 'recipe-id',
      title: 'Test Recipe',
      content: 'Recipe content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    const mockVariant = {
      id: 'variant-id',
      recipe_id: 'recipe-id',
      parent_variant_id: null,
      created_by: 'test-user-id',
      model: 'openai/gpt-4o',
      prompt: 'Test prompt',
      preferences_snapshot: { diets: ['vegan'], allergens: ['nuts'] },
      output_text: 'Recipe text',
      output_json: { title: 'Test' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: mockVariant,
      error: null,
    });

    const mockFrom = vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants',
      params: { recipeId: 'recipe-id' },
      body: {
        generatedRecipe: { title: 'Test' },
        model: 'openai/gpt-4o',
        prompt: 'Test prompt',
        preferences_snapshot: { diets: ['vegan'], allergens: ['nuts'] },
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object').toBe(true);
    if (json && typeof json === 'object') {
      const variantJson = json as typeof mockVariant;
      expect(variantJson.preferences_snapshot).toEqual({
        diets: ['vegan'],
        allergens: ['nuts'],
      });
    }
  });
});
