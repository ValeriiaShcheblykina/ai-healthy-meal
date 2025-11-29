import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './reset-password';
import {
  createMockAPIContext,
  getResponseJson,
} from '../../../../test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '../../../../test/mocks/supabase.mock';

describe('POST /api/auth/reset-password', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should successfully reset password with valid token and password', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/reset-password',
      body: {
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json && typeof json === 'object' && 'message' in json).toBe(true);
    if (json && typeof json === 'object' && 'message' in json) {
      const messageJson = json as { message: string };
      expect(messageJson.message).toBe('Password reset successfully');
    }
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: 'NewPassword123!',
    });
  });

  it('should return 400 for invalid password format', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/reset-password',
      body: {
        password: 'weak',
        confirmPassword: 'weak',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('message', 'Invalid request data');
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('should return 400 when passwords do not match', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/reset-password',
      body: {
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json).toHaveProperty('error');
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid or expired token', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: {
        user: null,
      },
      error: {
        message: 'Invalid or expired token',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/reset-password',
      body: {
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain(
        'Invalid or expired reset link'
      );
    }
  });

  it('should return 400 for other update errors', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: {
        user: null,
      },
      error: {
        message: 'Password is too weak',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/reset-password',
      body: {
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toContain('Unable to reset password');
    }
  });

  it('should handle JSON parsing errors', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/reset-password',
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
