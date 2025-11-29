/**
 * @module profile.client.service
 * @description Frontend service for profile-related API calls.
 * Centralizes all profile API interactions for the client-side application.
 *
 * This service provides:
 * - Get current user profile
 * - Update user profile (display name and diets)
 * - Generate recipe from dietary preferences
 * - Consistent error handling
 * - Authentication handling
 *
 * @example
 * import { ProfileClientService } from '@/lib/services/client/profile.client.service';
 *
 * const service = new ProfileClientService();
 * const profile = await service.getCurrentUser();
 * await service.updateProfile({ displayName: 'John', diets: ['vegan', 'vegetarian'] });
 * const redirectUrl = await service.generateRecipeFromDiets(['vegan', 'vegetarian']);
 */

import { fetchApi } from './api-client.helper';

export interface CurrentUserResponse {
  user: {
    id: string;
    email: string;
    emailConfirmed: boolean;
    profile: {
      displayName: string | null;
      diets: string[];
      allergens: string[];
      dislikedIngredients: string[];
      calorieTarget: number | null;
      createdAt: string;
      updatedAt: string;
    } | null;
  };
}

export interface UpdateProfileResponse {
  profile: {
    displayName: string | null;
    diets: string[];
    updatedAt: string;
  };
  message: string;
}

export interface UpdateProfileData {
  displayName?: string | null;
  diets?: string[] | null;
}

export interface GeneratedRecipeData {
  title?: string;
  description?: string;
  ingredients?: unknown;
  instructions?: unknown;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
}

/**
 * Client-side service for profile API operations.
 *
 * All methods handle authentication automatically via cookies.
 * Errors are thrown as Error instances with appropriate messages.
 */
export class ProfileClientService {
  private readonly baseUrl = '/api/auth';

  /**
   * Fetches the current authenticated user's profile.
   *
   * @async
   * @method getCurrentUser
   * @returns {Promise<CurrentUserResponse>} Current user data with profile
   *
   * @throws {Error} If request fails or authentication is required
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    return fetchApi<CurrentUserResponse>(
      `${this.baseUrl}/me`,
      { method: 'GET' },
      { defaultMessage: 'Failed to fetch user profile' }
    );
  }

  /**
   * Updates the current user's profile.
   *
   * @async
   * @method updateProfile
   * @param {UpdateProfileData} data - Profile data to update
   * @returns {Promise<UpdateProfileResponse>} Updated profile data
   *
   * @throws {Error} If update fails
   */
  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    return fetchApi<UpdateProfileResponse>(
      `${this.baseUrl}/profile`,
      { method: 'PATCH', body: data },
      { defaultMessage: 'Failed to update profile. Please try again.' }
    );
  }

  /**
   * Generates a recipe based on selected dietary preferences.
   *
   * @async
   * @method generateRecipeFromDiets
   * @param {string[]} diets - Array of selected diet types
   * @returns {Promise<string>} URL to redirect to recipe creation page with generated data
   *
   * @throws {Error} If generation fails or no diets provided
   */
  async generateRecipeFromDiets(diets: string[]): Promise<string> {
    if (!diets || diets.length === 0) {
      throw new Error('Please select at least one dietary preference');
    }

    // Call recipes API to generate recipe
    const generatedRecipe = await fetchApi<GeneratedRecipeData>(
      '/api/recipes/ai-generation',
      { method: 'POST', body: { diets } },
      { defaultMessage: 'Failed to generate recipe. Please try again.' }
    );

    // Build URL parameters for redirect
    const params = new URLSearchParams();
    params.set('generated', 'true');
    params.set('title', generatedRecipe.title || '');

    if (generatedRecipe.description) {
      params.set('description', generatedRecipe.description);
    }
    if (generatedRecipe.ingredients) {
      params.set('ingredients', JSON.stringify(generatedRecipe.ingredients));
    }
    if (generatedRecipe.instructions) {
      params.set('instructions', JSON.stringify(generatedRecipe.instructions));
    }
    if (generatedRecipe.prep_time) {
      params.set('prep_time', generatedRecipe.prep_time.toString());
    }
    if (generatedRecipe.cook_time) {
      params.set('cook_time', generatedRecipe.cook_time.toString());
    }
    if (generatedRecipe.servings) {
      params.set('servings', generatedRecipe.servings.toString());
    }

    return `/recipes/new?${params.toString()}`;
  }
}
