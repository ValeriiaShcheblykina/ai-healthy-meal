import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './profile';
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

describe('PATCH /api/auth/profile', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should update existing profile with displayName and diets', async () => {
    const existingProfile = {
      user_id: 'test-user-id',
      extra: { diets: ['vegan'] },
    };

    const updatedProfile = {
      display_name: 'Updated Name',
      extra: { diets: ['vegan', 'vegetarian'] },
      updated_at: '2024-01-02T00:00:00Z',
    };

    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProfile,
            error: null,
          }),
        };
      } else {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: updatedProfile,
            error: null,
          }),
        };
      }
    });

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'PATCH',
      url: 'http://localhost:4321/api/auth/profile',
      body: {
        displayName: 'Updated Name',
        diets: ['vegan', 'vegetarian'],
      },
      supabase: mockSupabase,
    });

    const response = await PATCH(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object' && 'profile' in json).toBe(true);
    if (json && typeof json === 'object' && 'profile' in json) {
      const profileJson = json as {
        profile: { displayName: string; diets: string[]; updatedAt: string };
        message: string;
      };
      expect(profileJson.profile.displayName).toBe(updatedProfile.display_name);
      expect(profileJson.profile.diets).toEqual(['vegan', 'vegetarian']);
      expect(profileJson.message).toBe('Profile updated successfully');
    }
  });

  it('should create new profile when it does not exist', async () => {
    const newProfile = {
      display_name: 'New User',
      extra: { diets: ['keto'] },
      updated_at: '2024-01-01T00:00:00Z',
    };

    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        // First call: check existing profile (not found)
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST116',
              message: 'Not found',
            },
          }),
        };
      } else {
        // Second call: insert new profile
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: newProfile,
            error: null,
          }),
        };
      }
    });

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'PATCH',
      url: 'http://localhost:4321/api/auth/profile',
      body: {
        displayName: 'New User',
        diets: ['keto'],
      },
      supabase: mockSupabase,
    });

    const response = await PATCH(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object' && 'profile' in json).toBe(true);
    if (json && typeof json === 'object' && 'profile' in json) {
      const profileJson = json as {
        profile: { displayName: string; diets: string[]; updatedAt: string };
        message: string;
      };
      expect(profileJson.profile.displayName).toBe(newProfile.display_name);
      expect(profileJson.profile.diets).toEqual(['keto']);
      expect(profileJson.message).toBe('Profile updated successfully');
    }
  });

  it('should return 400 for invalid request body', async () => {
    const context = createMockAPIContext({
      method: 'PATCH',
      url: 'http://localhost:4321/api/auth/profile',
      body: {
        displayName: 'a'.repeat(101), // Exceeds max length
        diets: ['invalid-diet'],
      },
      supabase: mockSupabase,
    });

    const response = await PATCH(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json).toHaveProperty('error');
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Invalid request data');
    }
  });

  it('should update only displayName when only displayName is provided', async () => {
    const existingProfile = {
      user_id: 'test-user-id',
      extra: { diets: ['vegan'] },
    };

    const updatedProfile = {
      display_name: 'New Display Name',
      extra: { diets: ['vegan'] },
      updated_at: '2024-01-02T00:00:00Z',
    };

    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProfile,
            error: null,
          }),
        };
      } else {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: updatedProfile,
            error: null,
          }),
        };
      }
    });

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'PATCH',
      url: 'http://localhost:4321/api/auth/profile',
      body: {
        displayName: 'New Display Name',
      },
      supabase: mockSupabase,
    });

    const response = await PATCH(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object' && 'profile' in json) {
      const profileJson = json as {
        profile: { displayName: string; diets: string[] };
      };
      expect(profileJson.profile.displayName).toBe('New Display Name');
      expect(profileJson.profile.diets).toEqual(['vegan']); // Should preserve existing diets
    }
  });

  it('should return 500 when profile update fails', async () => {
    const existingProfile = {
      user_id: 'test-user-id',
      extra: {},
    };

    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProfile,
            error: null,
          }),
        };
      } else {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'Database error',
              code: 'PGRST500',
            },
          }),
        };
      }
    });

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'PATCH',
      url: 'http://localhost:4321/api/auth/profile',
      body: {
        displayName: 'Test',
      },
      supabase: mockSupabase,
    });

    const response = await PATCH(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string } };
      expect(errorJson.error.code).toBe('INTERNAL_ERROR');
    }
  });

  it('should handle null displayName', async () => {
    const existingProfile = {
      user_id: 'test-user-id',
      extra: {},
    };

    const updatedProfile = {
      display_name: null,
      extra: {},
      updated_at: '2024-01-02T00:00:00Z',
    };

    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: existingProfile,
            error: null,
          }),
        };
      } else {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: updatedProfile,
            error: null,
          }),
        };
      }
    });

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'PATCH',
      url: 'http://localhost:4321/api/auth/profile',
      body: {
        displayName: null,
      },
      supabase: mockSupabase,
    });

    const response = await PATCH(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object' && 'profile' in json) {
      const profileJson = json as { profile: { displayName: null } };
      expect(profileJson.profile.displayName).toBeNull();
    }
  });
});
