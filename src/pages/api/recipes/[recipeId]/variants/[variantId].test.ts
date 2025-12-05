import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE } from './[variantId]';
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
const mockGetRecipeVariant = vi.fn();
const mockDeleteRecipeVariant = vi.fn();

vi.mock('@/lib/services/recipe.service', () => ({
  RecipeService: class {
    getRecipe = mockGetRecipe;
    getRecipeVariant = mockGetRecipeVariant;
    deleteRecipeVariant = mockDeleteRecipeVariant;
  },
}));

describe('GET /api/recipes/:recipeId/variants/:variantId', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should return variant by id', async () => {
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
      preferences_snapshot: {},
      output_text: 'Recipe text',
      output_json: { title: 'Variant Recipe' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(mockRecipe);
    mockGetRecipeVariant.mockResolvedValue(mockVariant);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object') {
      const variantJson = json as typeof mockVariant;
      expect(variantJson.id).toBe(mockVariant.id);
      expect(variantJson.recipe_id).toBe(mockVariant.recipe_id);
      expect(variantJson.model).toBe(mockVariant.model);
      // deleted_at should be excluded from response
      expect('deleted_at' in variantJson).toBe(false);
    }
    expect(mockGetRecipe).toHaveBeenCalledWith('recipe-id');
    expect(mockGetRecipeVariant).toHaveBeenCalledWith(
      'recipe-id',
      'variant-id'
    );
  });

  it('should return 404 when recipe is not found', async () => {
    mockGetRecipe.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/non-existent-id/variants/variant-id',
      params: { recipeId: 'non-existent-id', variantId: 'variant-id' },
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
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
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

  it('should return 404 when variant is not found', async () => {
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
    mockGetRecipeVariant.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/non-existent-variant-id',
      params: { recipeId: 'recipe-id', variantId: 'non-existent-variant-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
      expect(errorJson.error.message).toBe('Variant not found');
    }
  });

  it('should return 400 when recipeId is missing', async () => {
    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes//variants/variant-id',
      params: { variantId: 'variant-id' },
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

  it('should return 400 when variantId is missing', async () => {
    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/',
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
    mockGetRecipeVariant.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
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
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });
});

describe('DELETE /api/recipes/:recipeId/variants/:variantId', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should successfully delete a variant', async () => {
    const mockVariant = {
      id: 'variant-id',
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
      deleted_at: null,
    };

    mockGetRecipeVariant.mockResolvedValue(mockVariant);
    mockDeleteRecipeVariant.mockResolvedValue(undefined);

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);

    expect(response.status).toBe(204);
    expect(mockGetRecipeVariant).toHaveBeenCalledWith(
      'recipe-id',
      'variant-id'
    );
    expect(mockDeleteRecipeVariant).toHaveBeenCalledWith(
      'recipe-id',
      'variant-id'
    );
  });

  it('should return 404 when variant is not found', async () => {
    mockGetRecipeVariant.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/non-existent-variant-id',
      params: { recipeId: 'recipe-id', variantId: 'non-existent-variant-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
      expect(errorJson.error.message).toBe('Variant not found');
    }
  });

  it('should return 404 when recipeId is missing', async () => {
    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes//variants/variant-id',
      params: { variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
    }
  });

  it('should return 404 when variantId is missing', async () => {
    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/',
      params: { recipeId: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
    }
  });

  it('should return 500 when service throws error', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    const mockVariant = {
      id: 'variant-id',
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
      deleted_at: null,
    };

    mockGetRecipeVariant.mockResolvedValue(mockVariant);
    mockDeleteRecipeVariant.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('INTERNAL_ERROR');
    }
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockRejectedValue(new Error('Unauthorized'));

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should handle soft delete correctly', async () => {
    const mockVariant = {
      id: 'variant-id',
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
      deleted_at: null,
    };

    mockGetRecipeVariant.mockResolvedValue(mockVariant);
    mockDeleteRecipeVariant.mockResolvedValue(undefined);

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id/variants/variant-id',
      params: { recipeId: 'recipe-id', variantId: 'variant-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);

    expect(response.status).toBe(204);
    expect(mockDeleteRecipeVariant).toHaveBeenCalledWith(
      'recipe-id',
      'variant-id'
    );
  });
});
