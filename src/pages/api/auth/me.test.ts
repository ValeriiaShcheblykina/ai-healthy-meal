import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './me';
import {
  createMockAPIContext,
  getResponseJson,
  createMockUser,
} from '../../../../test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '../../../../test/mocks/supabase.mock';
import * as getAuthenticatedUserModule from '@/lib/auth/get-authenticated-user';

// Mock the getAuthenticatedUserId function
vi.mock('@/lib/auth/get-authenticated-user', () => ({
  getAuthenticatedUserId: vi.fn(),
}));

describe('GET /api/auth/me', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockResolvedValue('test-user-id');
  });

  it('should return user data with profile', async () => {
    const mockUser = createMockUser();
    const mockProfile = {
      user_id: 'test-user-id',
      display_name: 'Test User',
      allergens: ['peanuts'],
      disliked_ingredients: ['cilantro'],
      calorie_target: 2000,
      extra: { diets: ['vegan', 'vegetarian'] },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
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
      method: 'GET',
      url: 'http://localhost:4321/api/auth/me',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object' && 'user' in json).toBe(true);
    if (json && typeof json === 'object' && 'user' in json) {
      const userJson = json as { user: unknown };
      expect(userJson.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        emailConfirmed: true,
      });
    }
  });

  it('should return user data without profile when profile does not exist', async () => {
    const mockUser = createMockUser();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
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
      method: 'GET',
      url: 'http://localhost:4321/api/auth/me',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object' && 'user' in json).toBe(true);
    if (json && typeof json === 'object' && 'user' in json) {
      const userJson = json as {
        user: {
          id: string;
          email: string;
          emailConfirmed: boolean;
          profile: null;
        };
      };
      expect(userJson.user.id).toBe(mockUser.id);
      expect(userJson.user.email).toBe(mockUser.email);
      expect(userJson.user.emailConfirmed).toBe(true);
      expect(userJson.user.profile).toBeNull();
    }
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(
      getAuthenticatedUserModule.getAuthenticatedUserId
    ).mockRejectedValue(new Error('Unauthorized'));

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/auth/me',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('error');
  });

  it('should return 401 when user is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: {
        message: 'User not found',
        status: 401,
      },
    });

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/auth/me',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { code: string; message: string } };
      expect(errorJson.error.code).toBe('UNAUTHORIZED');
      expect(errorJson.error.message).toBe('User not found');
    }
  });

  it('should return 500 when profile fetch fails with non-PGRST116 error', async () => {
    const mockUser = createMockUser();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST500',
          message: 'Database error',
        },
      }),
    }));

    mockSupabase.from = mockFrom as never;

    const context = createMockAPIContext({
      method: 'GET',
      url: 'http://localhost:4321/api/auth/me',
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

  it('should handle user with unconfirmed email', async () => {
    const mockUser = createMockUser({ email_confirmed_at: null });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
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
      method: 'GET',
      url: 'http://localhost:4321/api/auth/me',
      supabase: mockSupabase,
    });

    const response = await GET(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    if (json && typeof json === 'object' && 'user' in json) {
      const userJson = json as { user: { emailConfirmed: boolean } };
      expect(userJson.user.emailConfirmed).toBe(false);
    }
  });
});
