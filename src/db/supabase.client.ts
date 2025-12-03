import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from './database.types.ts';

export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: 'lax',
};

function parseCookieHeader(
  cookieHeader: string
): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  runtime?: { env?: Record<string, string> };
}) => {
  // Support both Node.js (import.meta.env) and Cloudflare (runtime.env)
  const supabaseUrl =
    context.runtime?.env?.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const supabaseKey =
    context.runtime?.env?.SUPABASE_KEY ?? import.meta.env.SUPABASE_KEY;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        // Set each cookie individually to handle errors gracefully
        // This prevents one failed cookie from blocking others
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            context.cookies.set(name, value, options);
          } catch (error) {
            // Silently ignore if cookies have already been sent
            // This can happen during async operations like token refresh
            // that occur after the response has been sent
            if (
              error instanceof Error &&
              (error.message.includes('already been sent') ||
                error.message.includes('cookies had already been sent'))
            ) {
              // Expected in some async scenarios - no action needed
              return;
            }
            // Re-throw unexpected errors
            throw error;
          }
        });
      },
    },
  });

  return supabase;
};

export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
