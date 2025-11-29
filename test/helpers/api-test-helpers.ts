import type { APIContext } from 'astro';
import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from '../mocks/supabase.mock';

/**
 * Creates a mock APIContext for testing API routes
 */
export function createMockAPIContext(
  options: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    supabase?: ReturnType<typeof createMockSupabaseClient>;
    cookies?: {
      get: (name: string) => { value: string } | undefined;
      set: (name: string, value: string, options?: unknown) => void;
      delete: (name: string, options?: unknown) => void;
    };
    redirect?: (url: string, status?: number) => Response;
  } = {}
): APIContext {
  const {
    method = 'GET',
    url = 'http://localhost:4321/api/test',
    body,
    headers = {},
    params = {},
    supabase = createMockSupabaseClient(),
    cookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    },
    redirect = vi.fn((url: string, status = 302) => {
      return new Response(null, { status, headers: { Location: url } });
    }),
  } = options;

  const requestBody = body !== undefined ? JSON.stringify(body) : null;
  const requestHeaders = new Headers(headers);
  if (requestBody) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  return {
    request,
    params,
    locals: {
      supabase: supabase as unknown as SupabaseClient,
      runtime: {
        env: {},
      },
    },
    cookies: cookies as unknown as APIContext['cookies'],
    redirect: redirect as unknown as APIContext['redirect'],
    url: new URL(url),
  } as APIContext;
}

/**
 * Helper to extract JSON from Response
 */
export async function getResponseJson<T = unknown>(
  response: Response
): Promise<T> {
  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

/**
 * Helper to create a mock user object
 */
export function createMockUser(
  overrides: Partial<{
    id: string;
    email: string;
    email_confirmed_at: string | null;
  }> = {}
) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create a mock session object
 */
export function createMockSession(
  overrides: Partial<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }> = {}
) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
    ...overrides,
  };
}
