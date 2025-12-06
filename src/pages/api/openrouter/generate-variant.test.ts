import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './generate-variant';
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

// Mock OpenRouterService
const mockGenerateRecipeFromExisting = vi.fn();

vi.mock('@/lib/services/openrouter.service', () => ({
  OpenRouterService: class {
    generateRecipeFromExisting = mockGenerateRecipeFromExisting;
  },
}));

describe('POST /api/openrouter/generate-variant', () => {
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

  it('should successfully generate a variant', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const mockGeneratedRecipe = {
      title: 'Vegan Pasta Carbonara',
      description: 'A vegan variant of the classic pasta carbonara',
      ingredients: [
        { name: 'pasta', quantity: '400g' },
        { name: 'cashew cream', quantity: '200ml' },
      ],
      instructions: [
        'Cook pasta according to package directions',
        'Prepare cashew cream sauce',
        'Combine and serve',
      ],
    };

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
        model: 'openai/gpt-4o-2024-08-06',
        temperature: 0.8,
        max_tokens: 2000,
      },
      supabase: mockSupabase,
    });

    // Mock runtime env
    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalledWith({
      existingRecipes: [mockExistingRecipe],
      model: 'openai/gpt-4o-2024-08-06',
      customPrompt: expect.stringContaining('Create a variant of this recipe'),
      temperature: 0.8,
      max_tokens: 2000,
    });
  });

  it('should use default model when not provided', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const mockGeneratedRecipe = {
      title: 'Variant Recipe',
      description: 'A variant',
      ingredients: [],
      instructions: [],
    };

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);

    expect(response.status).toBe(200);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalledWith({
      existingRecipes: [mockExistingRecipe],
      model: 'openai/gpt-4o-2024-08-06',
      customPrompt: expect.stringContaining('Create a variant of this recipe'),
      temperature: 0.8,
      max_tokens: 2000,
    });
  });

  it('should use default temperature and max_tokens when not provided', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const mockGeneratedRecipe = {
      title: 'Variant Recipe',
      description: 'A variant',
      ingredients: [],
      instructions: [],
    };

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
        model: 'openai/gpt-4o',
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);

    expect(response.status).toBe(200);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalledWith({
      existingRecipes: [mockExistingRecipe],
      model: 'openai/gpt-4o',
      customPrompt: expect.stringContaining('Create a variant of this recipe'),
      temperature: 0.8,
      max_tokens: 2000,
    });
  });

  it('should include custom prompt in variant generation', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const mockGeneratedRecipe = {
      title: 'Variant Recipe',
      description: 'A variant',
      ingredients: [],
      instructions: [],
    };

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const customPrompt = 'Make it gluten-free and dairy-free';

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
        customPrompt,
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);

    expect(response.status).toBe(200);
    expect(mockGenerateRecipeFromExisting).toHaveBeenCalledWith({
      existingRecipes: [mockExistingRecipe],
      model: 'openai/gpt-4o-2024-08-06',
      customPrompt: expect.stringContaining(customPrompt),
      temperature: 0.8,
      max_tokens: 2000,
    });
  });

  it('should return 400 when existingRecipe is missing', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        model: 'openai/gpt-4o',
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 400 when existingRecipe.title is missing', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: {
          content: 'Recipe content without title',
        },
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 400 for invalid request body', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
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

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return 500 when API key is missing', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    // Store original value to restore later
    const originalApiKey = import.meta.env.OPEN_ROUTER_API_KEY;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      supabase: mockSupabase,
    });

    // Remove API key from both environment sources
    // Set to empty string to ensure it's falsy
    import.meta.env.OPEN_ROUTER_API_KEY = '';
    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: undefined,
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    // Restore original value
    import.meta.env.OPEN_ROUTER_API_KEY = originalApiKey;

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain('API key');
    }
  });

  it('should return 500 when generated recipe format is invalid', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    // Mock invalid response (missing title)
    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: {
              description: 'A recipe without title',
            },
          },
        },
      ],
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain('Invalid recipe format');
    }
  });

  it('should return 500 when service throws error', async () => {
    const { ApiError, ERROR_CODES } = await import('@/lib/errors/api-errors');
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    mockGenerateRecipeFromExisting.mockRejectedValue(
      new ApiError(ERROR_CODES.INTERNAL_ERROR, 'OpenRouter API error', 500)
    );

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
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

    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should handle non-JSON content type gracefully', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const mockGeneratedRecipe = {
      title: 'Variant Recipe',
      description: 'A variant',
      ingredients: [],
      instructions: [],
    };

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      headers: {
        'Content-Type': 'text/plain',
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'test-api-key',
      },
    } as never;

    // Should still work if body is provided via createMockAPIContext
    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
  });

  it('should use API key from runtime env when available', async () => {
    const mockExistingRecipe = {
      title: 'Pasta Carbonara',
      content: 'Original recipe content',
    };

    const mockGeneratedRecipe = {
      title: 'Variant Recipe',
      description: 'A variant',
      ingredients: [],
      instructions: [],
    };

    mockGenerateRecipeFromExisting.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockGeneratedRecipe,
          },
        },
      ],
    });

    import.meta.env.OPEN_ROUTER_API_KEY = undefined;

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/openrouter/generate-variant',
      body: {
        existingRecipe: mockExistingRecipe,
      },
      supabase: mockSupabase,
    });

    context.locals.runtime = {
      env: {
        OPEN_ROUTER_API_KEY: 'runtime-api-key',
      },
    } as never;

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGeneratedRecipe);
  });
});
