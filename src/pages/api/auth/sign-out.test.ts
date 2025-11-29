import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './sign-out';
import { createMockAPIContext } from '../../../../test/helpers/api-test-helpers';
import { createMockSupabaseClient } from '../../../../test/mocks/supabase.mock';

describe('POST /api/auth/sign-out', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockCookies: {
    delete: ReturnType<typeof vi.fn>;
  };
  let mockRedirect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockCookies = {
      delete: vi.fn(),
    };
    mockRedirect = vi.fn((url: string, status = 302) => {
      return new Response(null, { status, headers: { Location: url } });
    });
    vi.clearAllMocks();
  });

  it('should successfully sign out and redirect', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-out',
      supabase: mockSupabase,
      cookies: mockCookies as never,
      redirect: mockRedirect as never,
    });

    const response = await POST(context);

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', {
      path: '/',
    });
    expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', {
      path: '/',
    });
    expect(mockRedirect).toHaveBeenCalledWith('/', 302);
    expect(response.status).toBe(302);
  });

  it('should clear cookies even if signOut fails with refresh token error', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: {
        message: 'Invalid Refresh Token: Refresh Token Not Found',
        status: 400,
      },
    });

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-out',
      supabase: mockSupabase,
      cookies: mockCookies as never,
      redirect: mockRedirect as never,
    });

    const response = await POST(context);

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', {
      path: '/',
    });
    expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', {
      path: '/',
    });
    expect(mockRedirect).toHaveBeenCalledWith('/', 302);
    expect(response.status).toBe(302);
  });

  it('should clear cookies and redirect even on unexpected errors', async () => {
    mockSupabase.auth.signOut.mockRejectedValue(new Error('Unexpected error'));

    const context = createMockAPIContext({
      method: 'POST',
      url: 'http://localhost:4321/api/auth/sign-out',
      supabase: mockSupabase,
      cookies: mockCookies as never,
      redirect: mockRedirect as never,
    });

    const response = await POST(context);

    expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', {
      path: '/',
    });
    expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', {
      path: '/',
    });
    expect(mockRedirect).toHaveBeenCalledWith('/', 302);
    expect(response.status).toBe(302);
  });
});
