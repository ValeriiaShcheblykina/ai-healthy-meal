import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './forgot-password';
import {
  createMockAPIContext,
  getResponseJson,
} from '@test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '@test/mocks/supabase.mock';

describe('POST /api/auth/forgot-password', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should successfully request password reset', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/forgot-password',
      body: {
        email: 'test@example.com',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message:
        'If an account exists with this email, you will receive password reset instructions',
    });
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      {
        redirectTo: 'http://localhost:4321/reset-password',
      }
    );
  });

  it('should return success even if email does not exist (security best practice)', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: {
        message: 'User not found',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/forgot-password',
      body: {
        email: 'nonexistent@example.com',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    // Should still return 200 for security (don't reveal if email exists)
    expect(response.status).toBe(200);
    expect(json && typeof json === 'object' && 'message' in json).toBe(true);
  });

  it('should return 400 for invalid email format', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/forgot-password',
      body: {
        email: 'not-an-email',
      },
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
    if (json && typeof json === 'object' && 'error' in json) {
      const errorJson = json as { error: { message: string } };
      expect(errorJson.error.message).toBe('Invalid request data');
    }
    expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('should return 400 for missing email', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/forgot-password',
      body: {},
      supabase: mockSupabase,
    });

    const response = await POST(context);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });

  it('should handle JSON parsing errors', async () => {
    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/forgot-password',
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
    expect(json && typeof json === 'object' && 'error' in json).toBe(true);
  });
});
