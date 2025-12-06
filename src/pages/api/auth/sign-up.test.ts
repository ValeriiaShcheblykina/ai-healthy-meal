import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './sign-up';
import {
  createMockAPIContext,
  getResponseJson,
  createMockUser,
} from '@test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '@test/mocks/supabase.mock';

describe('POST /api/auth/sign-up', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should successfully create a new user account', async () => {
    const mockUser = createMockUser();

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockUser,
        session: null,
      },
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-up',
      body: {
        email: 'newuser@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        displayName: 'New User',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json).toEqual({
      user: {
        id: mockUser.id,
        email: mockUser.email,
      },
      message: 'Account created successfully',
    });
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'Test123!@#',
      options: {
        data: {
          display_name: 'New User',
        },
      },
    });
  });

  it('should create account without display name', async () => {
    const mockUser = createMockUser();

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockUser,
        session: null,
      },
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-up',
      body: {
        email: 'newuser@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json).toHaveProperty('user');
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'Test123!@#',
      options: {
        data: {
          display_name: undefined,
        },
      },
    });
  });

  it('should return 400 for invalid request body', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-up',
      body: {
        email: 'not-an-email',
        password: 'weak',
        confirmPassword: 'weak',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json).toHaveProperty('error');
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Invalid request data');
    }
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('should return 409 for duplicate email', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: {
        message: 'User already registered',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-up',
      body: {
        email: 'existing@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(409);
    expect(json).toHaveProperty('error');
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain('already exists');
    }
  });

  it('should return 400 for other sign-up errors', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: {
        message: 'Password is too weak',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-up',
      body: {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain('Unable to create account');
    }
  });

  it('should handle JSON parsing errors', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-up',
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

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('error');
  });
});
