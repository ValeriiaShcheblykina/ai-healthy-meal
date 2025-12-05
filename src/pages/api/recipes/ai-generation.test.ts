import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './ai-generation';
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
const mockListRecipes = vi.fn();

vi.mock('@/lib/services/recipe.service', () => ({
  RecipeService: class {
    listRecipes = mockListRecipes;
  },
}));

// Mock OpenRouterService
const mockGenerateRecipeFromExisting = vi.fn();

vi.mock('@/lib/services/openrouter.service', () => ({
  OpenRouterService: class {
    generateRecipeFromExisting = mockGenerateRecipeFromExisting;
  },
}));

describe('POST /api/recipes/ai-generation', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');

    // Set up default environment
    import.meta.env.OPEN_ROUTER_API_KEY = 'test-api-key';
  });

  it('should successfully generate a recipe from existing recipes', async () => {
    const mockRecipes = {
      data: [
        {
          id: 'recipe-1',
          title: 'Pasta Carbonara',
          content: 'Recipe content',
          content_json: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    };

    const mockGeneratedRecipe = {
      title: 'New Pasta Recipe',
      content: 'Generated recipe content',
      content_json: {
        ingredients: ['pasta', 'sauce'],
        steps: ['Cook pasta', 'Add sauce'],
      },
    };

    mockListRecipes.mockResolvedValue(mockRecipes);
    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {},
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalled();
  });

  it('should generate recipe with user profile preferences', async () => {
    const mockRecipes = {
      data: [
        {
          id: 'recipe-1',
          title: 'Vegan Salad',
          content: 'Recipe content',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    };

    const mockProfile = {
      user_id: 'test-user-id',
      extra: { diets: ['vegan', 'vegetarian'] },
      allergens: ['peanuts'],
      disliked_ingredients: ['cilantro'],
      calorie_target: 2000,
    };

    const mockGeneratedRecipe = {
      title: 'Vegan Recipe',
      content: 'Generated vegan recipe',
    };

    mockListRecipes.mockResolvedValue(mockRecipes);
    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {},
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalled();
  });

  it('should return 400 when no recipes exist and no diets provided', async () => {
    mockListRecipes.mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {},
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

  it('should generate recipe from diets when provided', async () => {
    const mockGeneratedRecipe = {
      title: 'Keto Recipe',
      content: 'Generated keto recipe',
    };

    mockListRecipes.mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 5,
        total: 0,
        total_pages: 0,
      },
    });

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {
        diets: ['keto'],
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalled();
  });

  it('should return 500 when API key is missing', async () => {
    // Clear API key
    delete import.meta.env.OPEN_ROUTER_API_KEY;

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {
        diets: ['vegan'],
      },
      supabase: mockSupabase,
    });

    // Override runtime.env to ensure API key is not available
    context.locals.runtime = {
      env: {},
    };

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      // The error message should mention API key
      expect(errorJson.error.message.toLowerCase()).toMatch(
        /api.*key|key.*not.*found|not.*configured/i
      );
    }
  });

  it('should handle custom prompt and model parameters', async () => {
    const mockRecipes = {
      data: [
        {
          id: 'recipe-1',
          title: 'Test Recipe',
          content: 'Recipe content',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    };

    const mockGeneratedRecipe = {
      title: 'Custom Recipe',
      content: 'Generated with custom prompt',
    };

    mockListRecipes.mockResolvedValue(mockRecipes);
    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {
        model: 'openai/gpt-4',
        customPrompt: 'Make it spicy',
        temperature: 0.9,
        maxRecipes: 5,
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'openai/gpt-4',
        customPrompt: 'Make it spicy',
        temperature: 0.9,
      })
    );
  });

  it('should return 500 when generated recipe format is invalid', async () => {
    const mockRecipes = {
      data: [
        {
          id: 'recipe-1',
          title: 'Test Recipe',
          content: 'Recipe content',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    };

    mockListRecipes.mockResolvedValue(mockRecipes);
    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Invalid format - not an object',
          },
        },
      ],
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {},
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      // The error message should mention invalid format
      expect(errorJson.error.message.toLowerCase()).toMatch(
        /invalid.*recipe|recipe.*format/i
      );
    }
  });

  it('should handle service errors', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    mockListRecipes.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Database error', 500)
    );

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Not found',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/recipes/ai-generation',
      body: {},
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
});
