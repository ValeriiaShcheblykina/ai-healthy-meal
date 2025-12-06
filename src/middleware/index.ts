import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '@/db/supabase.client.ts';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/email-confirmation',
];

function isPublicPath(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  // Allow all auth API endpoints
  return pathname.startsWith('/api/auth/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  // Create Supabase instance with proper cookie handling
  // Pass runtime for Cloudflare Pages support
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtime: context.locals.runtime,
  });

  locals.supabase = supabase;

  // Skip auth check for public paths
  if (isPublicPath(url.pathname)) {
    return next();
  }

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? '',
    };
  } else {
    // Redirect to sign-in for protected routes
    return redirect('/sign-in');
  }

  return next();
});
