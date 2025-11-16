/**
 * Supabase client for E2E tests
 * Uses .env.test environment variables
 *
 * IMPORTANT: This uses the SERVICE ROLE KEY for admin operations.
 * - Required for: Deleting test users, bypassing RLS policies
 * - Security: Only use in test environment, NEVER in production or client-side code
 * - The public (anon) key cannot perform admin operations needed for cleanup
 */
import {
  createClient,
  type SupabaseClient as SupabaseClientType,
} from '@supabase/supabase-js';
import type { Database } from '../../src/db/database.types';

/**
 * Create Supabase admin client for E2E test cleanup
 *
 * Uses service_role key to:
 * - Delete test users via auth.admin API
 * - Bypass RLS policies for complete cleanup
 * - Ensure test isolation
 *
 * @returns Supabase client with admin privileges
 * @throws Error if required environment variables are not set
 */
export const createSupabaseTestClient = () => {
  // Get env vars at runtime (not at module load time)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test\n\n' +
        'The SERVICE ROLE KEY is required for E2E test cleanup because:\n' +
        '  1. User deletion requires admin privileges\n' +
        '  2. RLS policies restrict public key access\n' +
        '  3. Full cleanup between test runs needs to bypass RLS\n\n' +
        'Get your service role key from: Supabase Dashboard → Project Settings → API → service_role\n' +
        'WARNING: Keep this key secure and NEVER commit it to version control!'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export type SupabaseTestClient = SupabaseClientType<Database>;
