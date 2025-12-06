import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './sign-in';
import {
  createMockAPIContext,
  getResponseJson,
  createMockUser,
  createMockSession,
} from '@test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '@test/mocks/supabase.mock';

describe('POST /api/auth/sign-in', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should successfully sign in with valid credentials', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession();

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: mockSession,
      },
      error: null,
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-in',
      body: {
        email: 'test@example.com',
        password: 'Test123!@#',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual({
      user: {
        id: mockUser.id,
        email: mockUser.email,
      },
    });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Test123!@#',
    });
  });

  it('should return 400 for invalid request body', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-in',
      body: {
        email: 'not-an-email',
        password: '',
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
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: {
        message: 'Invalid login credentials',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-in',
      body: {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json).toHaveProperty('error');
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain('Invalid email or password');
    }
  });

  it('should return 500 when session creation fails', async () => {
    const mockUser = createMockUser();

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: null,
      },
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-in',
      body: {
        email: 'test@example.com',
        password: 'Test123!@#',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('error');
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Failed to create session');
    }
  });

  it('should return 500 when session verification fails', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession();

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: mockSession,
      },
      error: null,
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-in',
      body: {
        email: 'test@example.com',
        password: 'Test123!@#',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('error');
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Failed to verify session');
    }
  });

  it('should handle JSON parsing errors', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-in',
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
