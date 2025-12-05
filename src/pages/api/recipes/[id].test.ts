import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './[id]';
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
const mockUpdateRecipe = vi.fn();
const mockDeleteRecipe = vi.fn();

vi.mock('@/lib/services/recipe.service', () => ({
  RecipeService: class {
    getRecipe = mockGetRecipe;
    updateRecipe = mockUpdateRecipe;
    deleteRecipe = mockDeleteRecipe;
  },
}));

describe('GET /api/recipes/:id', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should return recipe by id', async () => {
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
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object') {
      const recipeJson = json as typeof mockRecipe;
      expect(recipeJson.id).toBe(mockRecipe.id);
      expect(recipeJson.title).toBe(mockRecipe.title);
    }
    expect(mockGetRecipe).toHaveBeenCalledWith('recipe-id');
  });

  it('should return 404 when recipe is not found', async () => {
    mockGetRecipe.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/non-existent-id',
      params: { id: 'non-existent-id' },
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

  it('should return 404 when id is missing', async () => {
    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/',
      params: {},
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Recipe ID is required');
    }
  });

  it('should handle service errors', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    mockGetRecipe.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
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

describe('PUT /api/recipes/:id', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should successfully update a recipe', async () => {
    const existingRecipe = {
      id: 'recipe-id',
      title: 'Original Title',
      content: 'Original content',
      user_id: 'test-user-id',
    };

    const updatedRecipe = {
      id: 'recipe-id',
      title: 'Updated Title',
      content: 'Updated content',
      content_json: null,
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      user_id: 'test-user-id',
      content_tsv: null,
      deleted_at: null,
    };

    mockGetRecipe.mockResolvedValue(existingRecipe);
    mockUpdateRecipe.mockResolvedValue(updatedRecipe);

    const context = createMockAPIContext({
      method: 'PUT',
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
      body: {
        title: 'Updated Title',
        content: 'Updated content',
      },
      supabase: mockSupabase,
    });

    const response = await PUT(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object') {
      const recipeJson = json as { title: string; content: string };
      expect(recipeJson.title).toBe('Updated Title');
      expect(recipeJson.content).toBe('Updated content');
    }
    expect(mockUpdateRecipe).toHaveBeenCalledWith('recipe-id', {
      title: 'Updated Title',
      content: 'Updated content',
      content_json: null,
      is_public: false,
    });
  });

  it('should return 400 for invalid request body', async () => {
    const existingRecipe = {
      id: 'recipe-id',
      title: 'Original Title',
      user_id: 'test-user-id',
    };

    mockGetRecipe.mockResolvedValue(existingRecipe);

    const context = createMockAPIContext({
      method: 'PUT',
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
      body: {
        title: 'a'.repeat(201), // Exceeds max length
      },
      supabase: mockSupabase,
    });

    const response = await PUT(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
    expect(mockUpdateRecipe).not.toHaveBeenCalled();
  });

  it('should return 404 when recipe does not exist', async () => {
    mockGetRecipe.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'PUT',
      url: 'http://localhost:4321/api/recipes/non-existent-id',
      params: { id: 'non-existent-id' },
      body: {
        title: 'Updated Title',
      },
      supabase: mockSupabase,
    });

    const response = await PUT(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('NOT_FOUND');
    }
    expect(mockUpdateRecipe).not.toHaveBeenCalled();
  });

  it('should return 404 when id is missing', async () => {
    const context = createMockAPIContext({
      method: 'PUT',
      url: 'http://localhost:4321/api/recipes/',
      params: {},
      body: {
        title: 'Updated Title',
      },
      supabase: mockSupabase,
    });

    const response = await PUT(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Recipe ID is required');
    }
  });

  it('should handle partial updates', async () => {
    const existingRecipe = {
      id: 'recipe-id',
      title: 'Original Title',
      content: 'Original content',
      user_id: 'test-user-id',
    };

    const updatedRecipe = {
      ...existingRecipe,
      title: 'Updated Title',
      updated_at: '2024-01-02T00:00:00Z',
    };

    mockGetRecipe.mockResolvedValue(existingRecipe);
    mockUpdateRecipe.mockResolvedValue(updatedRecipe);

    const context = createMockAPIContext({
      method: 'PUT',
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
      body: {
        title: 'Updated Title',
      },
      supabase: mockSupabase,
    });

    const response = await PUT(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object') {
      const recipeJson = json as { title: string };
      expect(recipeJson.title).toBe('Updated Title');
    }
  });
});

describe('DELETE /api/recipes/:id', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should successfully delete a recipe', async () => {
    const existingRecipe = {
      id: 'recipe-id',
      title: 'Recipe to Delete',
      user_id: 'test-user-id',
    };

    mockGetRecipe.mockResolvedValue(existingRecipe);
    mockDeleteRecipe.mockResolvedValue(undefined);

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
      supabase: mockSupabase,
    });

    const response = await DELETE(context);

    expect(response.status).toBe(204);
    expect(mockDeleteRecipe).toHaveBeenCalledWith('recipe-id');
  });

  it('should return 404 when recipe does not exist', async () => {
    mockGetRecipe.mockResolvedValue(null);

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/non-existent-id',
      params: { id: 'non-existent-id' },
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
    expect(mockDeleteRecipe).not.toHaveBeenCalled();
  });

  it('should return 404 when id is missing', async () => {
    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/',
      params: {},
      supabase: mockSupabase,
    });

    const response = await DELETE(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Recipe ID is required');
    }
  });

  it('should handle service errors', async () => {
    const existingRecipe = {
      id: 'recipe-id',
      title: 'Recipe to Delete',
      user_id: 'test-user-id',
    };

    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    mockGetRecipe.mockResolvedValue(existingRecipe);
    mockDeleteRecipe.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const context = createMockAPIContext({
      method: 'DELETE',
      url: 'http://localhost:4321/api/recipes/recipe-id',
      params: { id: 'recipe-id' },
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
});
