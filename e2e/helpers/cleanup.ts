/**
 * Database cleanup utilities for E2E tests
 */
import { createSupabaseTestClient } from './supabase-test-client';

/**
 * Delete all test users created during E2E tests
 * Looks for users with emails matching test patterns
 */
export async function cleanupTestUsers() {
  const supabase = createSupabaseTestClient();

  try {
    // Get all users using admin API
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users for cleanup:', listError);
      return;
    }

    if (!users || users.length === 0) {
      console.info('No users found to clean up');
      return;
    }

    // Filter test users (those with test emails)
    const testUsers = users.filter(
      (user) =>
        user.email?.startsWith('test.') ||
        user.email?.includes('@example.com') ||
        user.email?.startsWith('e2e-')
    );

    console.info(`Found ${testUsers.length} test user(s) to clean up`);

    // Delete each test user
    for (const user of testUsers) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteError) {
        console.error(`Error deleting user ${user.email}:`, deleteError);
      } else {
        console.info(`Deleted test user: ${user.email}`);
      }
    }

    console.info('Test user cleanup completed');
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
}

/**
 * Delete all test recipes created during E2E tests
 * Uses soft delete by setting deleted_at timestamp
 */
export async function cleanupTestRecipes() {
  const supabase = createSupabaseTestClient();

  try {
    // Soft delete all recipes by setting deleted_at
    const { error, count } = await supabase
      .from('recipes')
      .update({ deleted_at: new Date().toISOString() })
      .is('deleted_at', null);

    if (error) {
      console.error('Error cleaning up test recipes:', error);
      return;
    }

    console.info(`Soft deleted ${count || 0} test recipe(s)`);
  } catch (error) {
    console.error('Unexpected error during recipe cleanup:', error);
  }
}

/**
 * Clean up all test data (users, recipes, etc.)
 * Call this in global teardown after all tests complete
 */
export async function cleanupAllTestData() {
  console.info('Starting E2E test data cleanup...');

  await cleanupTestRecipes();
  await cleanupTestUsers();

  console.info('E2E test data cleanup completed');
}

/**
 * Clean up a specific user by email
 * Useful for cleaning up after individual test failures
 */
export async function cleanupUserByEmail(email: string) {
  const supabase = createSupabaseTestClient();

  try {
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users?.find((u) => u.email === email);

    if (user) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteError) {
        console.error(`Error deleting user ${email}:`, deleteError);
      } else {
        console.info(`Deleted user: ${email}`);
      }
    } else {
      console.info(`User not found: ${email}`);
    }
  } catch (error) {
    console.error('Unexpected error during user cleanup:', error);
  }
}

/**
 * Clean up recipes for a specific user
 */
export async function cleanupRecipesForUser(userId: string) {
  const supabase = createSupabaseTestClient();

  try {
    const { error, count } = await supabase
      .from('recipes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      console.error('Error cleaning up recipes for user:', error);
      return;
    }

    console.info(`Soft deleted ${count || 0} recipe(s) for user ${userId}`);
  } catch (error) {
    console.error('Unexpected error during recipe cleanup:', error);
  }
}
