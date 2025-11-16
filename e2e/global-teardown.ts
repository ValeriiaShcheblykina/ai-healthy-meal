/**
 * Global teardown for Playwright E2E tests
 * Cleans up all test data from Supabase after tests complete
 */
import { cleanupAllTestData } from './helpers/cleanup';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test file for teardown
const envPath = path.resolve(process.cwd(), '.env.test');
const result = dotenv.config({ path: envPath });

async function globalTeardown() {
  console.log('\n=== Running Global Teardown ===\n');
  
  // Debug: Check if env file was loaded
  if (result.error) {
    console.warn(`Warning: Could not load .env.test file from ${envPath}`);
    console.warn('Error:', result.error.message);
  } else {
    console.log('✓ Loaded .env.test file');
  }
  
  // Debug: Check if required env vars are present (without logging values)
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log(`Environment check:
  - SUPABASE_URL: ${hasSupabaseUrl ? '✓ Set' : '✗ Missing'}
  - SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✓ Set' : '✗ Missing'}
  `);
  
  if (!hasSupabaseUrl || !hasServiceKey) {
    console.error('⚠️  Skipping cleanup - required environment variables are missing');
    console.error('Make sure .env.test exists in the project root and contains:');
    console.error('  - SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  try {
    await cleanupAllTestData();
    console.log('\n=== Global Teardown Completed Successfully ===\n');
  } catch (error) {
    console.error('\n=== Global Teardown Failed ===\n', error);
    // Don't throw to avoid failing the test run
  }
}

export default globalTeardown;

