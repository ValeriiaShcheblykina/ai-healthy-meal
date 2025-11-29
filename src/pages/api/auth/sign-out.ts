import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  try {
    const supabase = locals.supabase;

    // Sign out from Supabase
    // Note: This may fail with "Invalid Refresh Token" if the token is already expired
    // which is fine - we still want to clear local cookies
    const { error } = await supabase.auth.signOut();

    // Only log errors that are not refresh token issues
    if (
      error &&
      error.message !== 'Invalid Refresh Token: Refresh Token Not Found'
    ) {
      if (import.meta.env.DEV) {
        console.error('Sign out error:', error);
      }
    }

    // Clear auth cookies manually before redirect to prevent
    // "cookies already sent" warnings
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    // Redirect to home page after sign out
    return redirect('/', 302);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Sign out error:', error);
    }

    // Still clear cookies and redirect even on error
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return redirect('/', 302);
  }
};
