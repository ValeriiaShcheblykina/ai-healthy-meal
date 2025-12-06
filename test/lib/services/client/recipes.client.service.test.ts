import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';
import type {
  RecipeListQueryParams,
  RecipeListResponseDTO,
  RecipeListItemDTO,
  CreateRecipeCommand,
  UpdateRecipeCommand,
  GeneratedRecipeVariantDTO,
  GenerateRecipeVariantCommand,
  RecipeVariantListQueryParams,
  RecipeVariantListResponseDTO,
  RecipeVariantDTO,
} from '@/types';

// Mock the api-client.helper
vi.mock('@/lib/services/client/api-client.helper', () => ({
  fetchApi: vi.fn(),
}));

// Mock ProfileClientService
vi.mock('@/lib/services/client/profile.client.service', () => ({
  ProfileClientService: vi.fn(),
}));

import { fetchApi } from '@/lib/services/client/api-client.helper';

describe('RecipesClientService', () => {
  let service: RecipesClientService;

  beforeEach(() => {
    service = new RecipesClientService();
    vi.clearAllMocks();
    // Reset fetchApi mock to avoid cross-test contamination
    vi.mocked(fetchApi).mockReset();
  });

  describe('listRecipes', () => {
    it('should fetch recipes with all parameters', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
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

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.listRecipes(params);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/recipes?page=1&limit=20&search=pasta&sort=created_at&order=desc',
        { method: 'GET' },
        { defaultMessage: 'Failed to fetch recipes' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch recipes with minimal parameters', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
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

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.listRecipes(params);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/recipes?page=1&limit=20',
        { method: 'GET' },
        { defaultMessage: 'Failed to fetch recipes' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty search string', async () => {
      const params: RecipeListQueryParams = {
        page: 1,
        limit: 20,
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

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      await service.listRecipes(params);

      // Empty search string is still included in URLSearchParams
      expect(fetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes?'),
        { method: 'GET' },
        { defaultMessage: 'Failed to fetch recipes' }
      );
      // The actual URL will include search=, but we just check it's called correctly
      const callArgs = vi.mocked(fetchApi).mock.calls[0];
      expect(callArgs[0]).toContain('page=1');
      expect(callArgs[0]).toContain('limit=20');
    });
  });

  describe('getRecipe', () => {
    it('should fetch a single recipe by ID', async () => {
      const recipeId = 'recipe-123';
      const mockRecipe: RecipeListItemDTO = {
        id: recipeId,
        title: 'Test Recipe',
        content: 'Recipe content',
        content_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      vi.mocked(fetchApi).mockResolvedValue(mockRecipe);

      const result = await service.getRecipe(recipeId);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}`,
        { method: 'GET' },
        {
          defaultMessage: 'Failed to fetch recipe',
          notFoundMessage: 'Recipe not found',
        }
      );
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('createRecipe', () => {
    it('should create a new recipe', async () => {
      const recipeData: CreateRecipeCommand = {
        title: 'New Recipe',
        content: 'Recipe content',
        is_public: false,
      };

      const mockRecipe: RecipeListItemDTO = {
        id: 'recipe-123',
        title: recipeData.title,
        content: recipeData.content ?? '',
        content_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_public: recipeData.is_public ?? false,
      };

      vi.mocked(fetchApi).mockResolvedValue(mockRecipe);

      const result = await service.createRecipe(recipeData);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/recipes',
        { method: 'POST', body: recipeData },
        { defaultMessage: 'Failed to create recipe' }
      );
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('updateRecipe', () => {
    it('should update an existing recipe', async () => {
      const recipeId = 'recipe-123';
      const updateData: UpdateRecipeCommand = {
        title: 'Updated Recipe',
        content: 'Updated content',
      };

      const mockRecipe: RecipeListItemDTO = {
        id: recipeId,
        title: updateData.title ?? 'Updated Recipe',
        content: updateData.content ?? 'Updated content',
        content_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        is_public: false,
      };

      vi.mocked(fetchApi).mockResolvedValue(mockRecipe);

      const result = await service.updateRecipe(recipeId, updateData);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}`,
        { method: 'PUT', body: updateData },
        {
          defaultMessage: 'Failed to update recipe',
          notFoundMessage: 'Recipe not found',
        }
      );
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe', async () => {
      const recipeId = 'recipe-123';

      vi.mocked(fetchApi).mockResolvedValue(undefined);

      await service.deleteRecipe(recipeId);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}`,
        { method: 'DELETE' },
        {
          defaultMessage: 'Failed to delete recipe',
          notFoundMessage: 'Recipe not found',
        }
      );
    });
  });

  describe('aiGenerateRecipe', () => {
    it('should generate a recipe with all options', async () => {
      const options = {
        model: 'openai/gpt-4o',
        customPrompt: 'Create a vegan recipe',
        temperature: 0.8,
        maxRecipes: 5,
        diets: ['vegan'],
        allergens: ['nuts'],
        dislikedIngredients: ['onions'],
        calorieTarget: 500,
      };

      const mockGeneratedRecipe = {
        title: 'Generated Recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
      };

      vi.mocked(fetchApi).mockResolvedValue(mockGeneratedRecipe);

      const result = await service.aiGenerateRecipe(options);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/recipes/ai-generation',
        { method: 'POST', body: options },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );
      expect(result).toEqual(mockGeneratedRecipe);
    });

    it('should generate a recipe with empty options', async () => {
      const mockGeneratedRecipe = {
        title: 'Generated Recipe',
      };

      vi.mocked(fetchApi).mockResolvedValue(mockGeneratedRecipe);

      const result = await service.aiGenerateRecipe();

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/recipes/ai-generation',
        { method: 'POST', body: {} },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );
      expect(result).toEqual(mockGeneratedRecipe);
    });
  });

  describe('generateRecipeVariant', () => {
    it('should generate a recipe variant with profile preferences', async () => {
      const recipeId = 'recipe-123';
      const options: GenerateRecipeVariantCommand = {
        use_profile_preferences: true,
        model: 'openai/gpt-4o',
      };

      const mockRecipe: RecipeListItemDTO = {
        id: recipeId,
        title: 'Original Recipe',
        content: 'Original content',
        content_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      const mockProfile = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan'],
            allergens: ['nuts'],
            dislikedIngredients: ['onions'],
            calorieTarget: 500,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      const mockGeneratedRecipe = {
        title: 'Variant Recipe',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
      };

      const mockVariant: GeneratedRecipeVariantDTO = {
        id: 'variant-123',
        recipe_id: recipeId,
        output_json: mockGeneratedRecipe,
        model: 'openai/gpt-4o',
        created_at: '2024-01-02T00:00:00Z',
        created_by: 'test-user-id',
        parent_variant_id: null,
        prompt: 'Test prompt',
        preferences_snapshot: {},
        output_text: 'Variant Recipe',
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Mock ProfileClientService constructor
      const mockGetCurrentUser = vi.fn().mockResolvedValue(mockProfile);
      vi.mocked(ProfileClientService).mockImplementation(function () {
        return {
          getCurrentUser: mockGetCurrentUser,
        } as unknown as ProfileClientService;
      });

      // Mock fetchApi calls
      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockRecipe) // getRecipe
        .mockResolvedValueOnce(mockGeneratedRecipe) // OpenRouter call
        .mockResolvedValueOnce(mockVariant); // Save variant

      const result = await service.generateRecipeVariant(recipeId, options);

      expect(fetchApi).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockVariant);
    });

    it('should generate a recipe variant without profile preferences', async () => {
      const recipeId = 'recipe-123';
      const options: GenerateRecipeVariantCommand = {
        use_profile_preferences: false,
        custom_prompt: 'Make it spicy',
        model: 'openai/gpt-4o',
      };

      const mockRecipe: RecipeListItemDTO = {
        id: recipeId,
        title: 'Original Recipe',
        content: 'Original content',
        content_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      const mockGeneratedRecipe = {
        title: 'Variant Recipe',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
      };

      const mockVariant: GeneratedRecipeVariantDTO = {
        id: 'variant-123',
        recipe_id: recipeId,
        output_json: mockGeneratedRecipe,
        model: 'openai/gpt-4o',
        created_at: '2024-01-02T00:00:00Z',
        created_by: 'test-user-id',
        parent_variant_id: null,
        prompt: 'Test prompt',
        preferences_snapshot: {},
        output_text: 'Variant Recipe',
        updated_at: '2024-01-02T00:00:00Z',
      };

      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockRecipe) // getRecipe
        .mockResolvedValueOnce(mockGeneratedRecipe) // OpenRouter call
        .mockResolvedValueOnce(mockVariant); // Save variant

      const result = await service.generateRecipeVariant(recipeId, options);

      expect(fetchApi).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockVariant);
    });

    it('should use default options when none provided', async () => {
      const recipeId = 'recipe-123';

      const mockRecipe: RecipeListItemDTO = {
        id: recipeId,
        title: 'Original Recipe',
        content: 'Original content',
        content_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      const mockProfile = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: null,
        },
      };

      const mockGeneratedRecipe = {
        title: 'Variant Recipe',
      };

      const mockVariant: GeneratedRecipeVariantDTO = {
        id: 'variant-123',
        recipe_id: recipeId,
        output_json: mockGeneratedRecipe,
        model: 'openai/gpt-4o-2024-08-06',
        created_at: '2024-01-02T00:00:00Z',
        created_by: 'test-user-id',
        parent_variant_id: null,
        prompt: 'Test prompt',
        preferences_snapshot: {},
        output_text: 'Variant Recipe',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockGetCurrentUser = vi.fn().mockResolvedValue(mockProfile);
      vi.mocked(ProfileClientService).mockImplementation(function () {
        return {
          getCurrentUser: mockGetCurrentUser,
        } as unknown as ProfileClientService;
      });

      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockRecipe)
        .mockResolvedValueOnce(mockGeneratedRecipe)
        .mockResolvedValueOnce(mockVariant);

      const result = await service.generateRecipeVariant(recipeId);

      expect(result).toEqual(mockVariant);
      // Should use default model
      expect(fetchApi).toHaveBeenCalledWith(
        '/api/openrouter/generate-variant',
        expect.objectContaining({
          body: expect.objectContaining({
            model: 'openai/gpt-4o-2024-08-06',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('listRecipeVariants', () => {
    it('should fetch recipe variants with all parameters', async () => {
      const recipeId = 'recipe-123';
      const params: RecipeVariantListQueryParams = {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
      };

      const mockResponse: RecipeVariantListResponseDTO = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };

      // Clear previous mocks and set new one
      vi.mocked(fetchApi).mockClear();
      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.listRecipeVariants(recipeId, params);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}/variants?page=1&limit=20&sort=created_at&order=desc`,
        { method: 'GET' },
        { defaultMessage: 'Failed to fetch recipe variants' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch recipe variants without parameters', async () => {
      const recipeId = 'recipe-123';

      const mockResponse: RecipeVariantListResponseDTO = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };

      // Clear previous mocks and set new one
      vi.mocked(fetchApi).mockClear();
      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.listRecipeVariants(recipeId);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}/variants?`,
        { method: 'GET' },
        { defaultMessage: 'Failed to fetch recipe variants' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRecipeVariant', () => {
    it('should fetch a single recipe variant', async () => {
      const recipeId = 'recipe-123';
      const variantId = 'variant-456';

      const mockVariant: RecipeVariantDTO = {
        id: variantId,
        recipe_id: recipeId,
        output_json: { title: 'Variant' },
        model: 'openai/gpt-4o',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'test-user-id',
        parent_variant_id: null,
        prompt: 'Test prompt',
        preferences_snapshot: null,
        output_text: 'Variant',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Clear previous mocks and set new one
      vi.mocked(fetchApi).mockClear();
      vi.mocked(fetchApi).mockResolvedValue(mockVariant);

      const result = await service.getRecipeVariant(recipeId, variantId);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}/variants/${variantId}`,
        { method: 'GET' },
        {
          defaultMessage: 'Failed to fetch recipe variant',
          notFoundMessage: 'Recipe variant not found',
        }
      );
      expect(result).toEqual(mockVariant);
    });
  });

  describe('deleteRecipeVariant', () => {
    it('should delete a recipe variant', async () => {
      const recipeId = 'recipe-123';
      const variantId = 'variant-456';

      vi.mocked(fetchApi).mockResolvedValue(undefined);

      await service.deleteRecipeVariant(recipeId, variantId);

      expect(fetchApi).toHaveBeenCalledWith(
        `/api/recipes/${recipeId}/variants/${variantId}`,
        { method: 'DELETE' },
        {
          defaultMessage: 'Failed to delete recipe variant',
          notFoundMessage: 'Recipe variant not found',
        }
      );
    });
  });
});
