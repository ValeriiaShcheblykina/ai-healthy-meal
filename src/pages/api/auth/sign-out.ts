import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    const supabase = locals.supabase;

    const { error } = await supabase.auth.signOut();

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Sign out error:', error);
      }

      // Redirect to home page even on error (user will be logged out locally)
      return redirect('/', 302);
    }

    // Redirect to home page after successful sign out
    return redirect('/', 302);
  } catch (error) {
    console.error('Sign out error:', error);
    // Redirect to home page even on unexpected error
    return redirect('/', 302);
  }
};
