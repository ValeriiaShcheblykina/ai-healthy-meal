import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';
import type {
  CurrentUserResponse,
  UpdateProfileResponse,
  UpdateProfileData,
} from '@/lib/services/client/profile.client.service';

// Mock the api-client.helper
vi.mock('@/lib/services/client/api-client.helper', () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from '@/lib/services/client/api-client.helper';

describe('ProfileClientService', () => {
  let service: ProfileClientService;

  beforeEach(() => {
    service = new ProfileClientService();
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user with profile', async () => {
      const mockResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan', 'vegetarian'],
            allergens: ['nuts'],
            dislikedIngredients: ['onions'],
            calorieTarget: 500,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.getCurrentUser();

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/auth/me',
        { method: 'GET' },
        { defaultMessage: 'Failed to fetch user profile' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch current user without profile', async () => {
      const mockResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: false,
          profile: null,
        },
      };

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.getCurrentUser();

      expect(result).toEqual(mockResponse);
      expect(result.user.profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile with all fields', async () => {
      const updateData: UpdateProfileData = {
        displayName: 'Updated Name',
        diets: ['vegan'],
        allergens: ['nuts', 'dairy'],
        dislikedIngredients: ['onions', 'garlic'],
        calorieTarget: 600,
      };

      const mockResponse: UpdateProfileResponse = {
        profile: {
          displayName: updateData.displayName ?? null,
          diets: updateData.diets ?? [],
          allergens: updateData.allergens ?? [],
          dislikedIngredients: updateData.dislikedIngredients ?? [],
          calorieTarget: updateData.calorieTarget ?? null,
          updatedAt: '2024-01-02T00:00:00Z',
        },
        message: 'Profile updated successfully',
      };

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.updateProfile(updateData);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/auth/profile',
        { method: 'PATCH', body: updateData },
        { defaultMessage: 'Failed to update profile. Please try again.' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update profile with partial data', async () => {
      const updateData: UpdateProfileData = {
        displayName: 'New Name',
      };

      const mockResponse: UpdateProfileResponse = {
        profile: {
          displayName: updateData.displayName ?? null,
          diets: [],
          allergens: [],
          dislikedIngredients: [],
          calorieTarget: null,
          updatedAt: '2024-01-02T00:00:00Z',
        },
        message: 'Profile updated successfully',
      };

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.updateProfile(updateData);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/auth/profile',
        { method: 'PATCH', body: updateData },
        { defaultMessage: 'Failed to update profile. Please try again.' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update profile with null values', async () => {
      const updateData: UpdateProfileData = {
        displayName: null,
        diets: null,
        calorieTarget: null,
      };

      const mockResponse: UpdateProfileResponse = {
        profile: {
          displayName: null,
          diets: [],
          allergens: [],
          dislikedIngredients: [],
          calorieTarget: null,
          updatedAt: '2024-01-02T00:00:00Z',
        },
        message: 'Profile updated successfully',
      };

      vi.mocked(fetchApi).mockResolvedValue(mockResponse);

      const result = await service.updateProfile(updateData);

      expect(result.profile.displayName).toBeNull();
      expect(result.profile.calorieTarget).toBeNull();
    });
  });

  describe('generateRecipeFromDiets', () => {
    it('should generate recipe from diets and return redirect URL', async () => {
      const diets = ['vegan', 'vegetarian'];
      const mockGeneratedRecipe = {
        title: 'Vegan Recipe',
        description: 'A delicious vegan recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2'],
        prep_time: 15,
        cook_time: 30,
        servings: 4,
      };

      vi.mocked(fetchApi).mockResolvedValue(mockGeneratedRecipe);

      const result = await service.generateRecipeFromDiets(diets);

      expect(fetchApi).toHaveBeenCalledWith(
        '/api/recipes/ai-generation',
        { method: 'POST', body: { diets } },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );

      expect(result).toContain('/recipes/new?');
      expect(result).toContain('generated=true');
      // URLSearchParams uses + for spaces, not %20
      expect(result).toContain('title=Vegan+Recipe');
      expect(result).toContain('description=A+delicious+vegan+recipe');
      expect(result).toContain('ingredients=');
      expect(result).toContain('instructions=');
      expect(result).toContain('prep_time=15');
      expect(result).toContain('cook_time=30');
      expect(result).toContain('servings=4');
    });

    it('should generate recipe with minimal data', async () => {
      const diets = ['vegan'];
      const mockGeneratedRecipe = {
        title: 'Vegan Recipe',
      };

      vi.mocked(fetchApi).mockResolvedValue(mockGeneratedRecipe);

      const result = await service.generateRecipeFromDiets(diets);

      expect(result).toContain('/recipes/new?');
      expect(result).toContain('generated=true');
      // URLSearchParams uses + for spaces
      expect(result).toContain('title=Vegan+Recipe');
    });

    it('should throw error when diets array is empty', async () => {
      await expect(service.generateRecipeFromDiets([])).rejects.toThrow(
        'Please select at least one dietary preference'
      );

      expect(fetchApi).not.toHaveBeenCalled();
    });

    it('should handle missing optional fields in generated recipe', async () => {
      const diets = ['vegan'];
      const mockGeneratedRecipe = {
        title: 'Vegan Recipe',
        description: 'A recipe',
        // Missing ingredients, instructions, times, servings
      };

      vi.mocked(fetchApi).mockResolvedValue(mockGeneratedRecipe);

      const result = await service.generateRecipeFromDiets(diets);

      expect(result).toContain('title=');
      expect(result).toContain('description=');
      // Should not contain ingredients, instructions, etc. if not provided
    });
  });

  describe('generateRecipeFromPreferences', () => {
    it('should generate recipe from all profile preferences', async () => {
      const mockUserResponse: CurrentUserResponse = {
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
        title: 'Generated Recipe',
        description: 'A recipe',
        ingredients: ['ingredient1'],
        instructions: ['step1'],
        prep_time: 10,
        cook_time: 20,
        servings: 2,
      };

      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockUserResponse) // getCurrentUser
        .mockResolvedValueOnce(mockGeneratedRecipe); // ai-generation

      const result = await service.generateRecipeFromPreferences();

      expect(fetchApi).toHaveBeenCalledTimes(2);
      expect(fetchApi).toHaveBeenNthCalledWith(
        2,
        '/api/recipes/ai-generation',
        {
          method: 'POST',
          body: {
            diets: ['vegan'],
            allergens: ['nuts'],
            dislikedIngredients: ['onions'],
            calorieTarget: 500,
          },
        },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );

      expect(result).toContain('/recipes/new?');
      expect(result).toContain('generated=true');
    });

    it('should generate recipe with only diets', async () => {
      const mockUserResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan'],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      const mockGeneratedRecipe = {
        title: 'Generated Recipe',
      };

      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockUserResponse)
        .mockResolvedValueOnce(mockGeneratedRecipe);

      const result = await service.generateRecipeFromPreferences();

      expect(fetchApi).toHaveBeenNthCalledWith(
        2,
        '/api/recipes/ai-generation',
        {
          method: 'POST',
          body: {
            diets: ['vegan'],
          },
        },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );

      expect(result).toContain('/recipes/new?');
    });

    it('should throw error when profile is null', async () => {
      const mockUserResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: null,
        },
      };

      vi.mocked(fetchApi).mockResolvedValueOnce(mockUserResponse);

      await expect(service.generateRecipeFromPreferences()).rejects.toThrow(
        'No profile found. Please set your preferences in your profile first.'
      );

      expect(fetchApi).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no preferences are set', async () => {
      const mockUserResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      vi.mocked(fetchApi).mockResolvedValueOnce(mockUserResponse);

      await expect(service.generateRecipeFromPreferences()).rejects.toThrow(
        'No preferences found. Please set your dietary preferences, allergens, disliked ingredients, or calorie target in your profile first.'
      );

      expect(fetchApi).toHaveBeenCalledTimes(1);
    });

    it('should generate recipe with only calorie target', async () => {
      const mockUserResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: 500,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      const mockGeneratedRecipe = {
        title: 'Generated Recipe',
      };

      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockUserResponse)
        .mockResolvedValueOnce(mockGeneratedRecipe);

      const result = await service.generateRecipeFromPreferences();

      expect(fetchApi).toHaveBeenNthCalledWith(
        2,
        '/api/recipes/ai-generation',
        {
          method: 'POST',
          body: {
            calorieTarget: 500,
          },
        },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );

      expect(result).toContain('/recipes/new?');
    });

    it('should generate recipe with only allergens', async () => {
      const mockUserResponse: CurrentUserResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: ['nuts', 'dairy'],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      const mockGeneratedRecipe = {
        title: 'Generated Recipe',
      };

      vi.mocked(fetchApi)
        .mockResolvedValueOnce(mockUserResponse)
        .mockResolvedValueOnce(mockGeneratedRecipe);

      await service.generateRecipeFromPreferences();

      expect(fetchApi).toHaveBeenNthCalledWith(
        2,
        '/api/recipes/ai-generation',
        {
          method: 'POST',
          body: {
            allergens: ['nuts', 'dairy'],
          },
        },
        { defaultMessage: 'Failed to generate recipe. Please try again.' }
      );
    });
  });
});
