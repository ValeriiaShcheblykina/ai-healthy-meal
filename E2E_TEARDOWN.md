# E2E Test Teardown Documentation

This document explains how E2E test cleanup is configured and how to use it.

## Overview

The E2E test suite automatically cleans up test data from Supabase after all tests complete using Playwright's global teardown feature.

## Configuration

### Environment Variables

Create a `.env.test` file in the project root with the following variables:

```env
# Base URL for E2E tests
BASE_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Supabase Service Role Key (REQUIRED for E2E test cleanup)
# This key has admin privileges and should NEVER be exposed in client-side code
# Only use in E2E tests for cleanup purposes
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

⚠️ **IMPORTANT**: Never commit `.env.test` to version control. It's already in `.gitignore`.

### Why Service Role Key is Required

The E2E cleanup uses the **service role key** (not the public anon key) because:

1. **User Deletion Requires Admin Privileges**: Only the service role can delete users via `supabase.auth.admin.deleteUser()`
2. **RLS Policies Restrict Public Access**: Your database has Row Level Security enabled. The public key respects RLS policies which prevent cross-user operations
3. **Complete Cleanup Needed**: Test isolation requires deleting all test data, which needs to bypass RLS
4. **Auth Admin API**: The `auth.admin` namespace is only available with the service role key

**Security Note**: The service role key is safe to use in E2E tests because:
- Tests run in a controlled environment (local development or CI)
- The `.env.test` file is in `.gitignore` and never committed
- It's only used for cleanup, not in production application code

### How It Works

1. **Global Teardown**: After all E2E tests complete, `e2e/global-teardown.ts` is automatically executed
2. **Cleanup Functions**: The teardown calls cleanup functions from `e2e/helpers/cleanup.ts`
3. **Test Data Removal**: 
   - Test users (emails containing `test+`, `@example.com`, or starting with `e2e-`) are deleted
   - Test recipes are soft-deleted (sets `deleted_at` timestamp)

## Files Structure

```
e2e/
├── global-teardown.ts           # Playwright global teardown entry point
└── helpers/
    ├── cleanup.ts               # Cleanup utility functions
    └── supabase-test-client.ts  # Supabase admin client for tests
```

## Cleanup Functions

### `cleanupAllTestData()`
Cleans up all test data (users and recipes). Called automatically in global teardown.

### `cleanupTestUsers()`
Deletes all users with test email patterns:
- Contains `test+`
- Contains `@example.com`
- Starts with `e2e-`

### `cleanupTestRecipes()`
Soft-deletes all recipes by setting `deleted_at` timestamp.

### `cleanupUserByEmail(email: string)`
Deletes a specific user by email. Useful for manual cleanup or debugging.

```typescript
import { cleanupUserByEmail } from './e2e/helpers/cleanup';
await cleanupUserByEmail('test+user@example.com');
```

### `cleanupRecipesForUser(userId: string)`
Soft-deletes all recipes for a specific user.

```typescript
import { cleanupRecipesForUser } from './e2e/helpers/cleanup';
await cleanupRecipesForUser('user-uuid');
```

## Manual Cleanup

If you need to manually clean up test data:

```bash
# Create a script or use Node.js REPL
node --loader tsx e2e/helpers/cleanup.ts
```

Or create a cleanup script in `package.json`:

```json
{
  "scripts": {
    "test:e2e:cleanup": "tsx e2e/global-teardown.ts"
  }
}
```

## Testing the Teardown

To verify teardown is working:

1. Run tests: `npm run test:e2e`
2. Check console output for cleanup messages:
   ```
   === Running Global Teardown ===
   Starting E2E test data cleanup...
   Soft deleted N test recipe(s)
   Found N test user(s) to clean up
   Deleted test user: test+user@example.com
   ...
   === Global Teardown Completed Successfully ===
   ```

## Troubleshooting

### "Missing required environment variables"
- Ensure `.env.test` exists with all required variables
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not just `SUPABASE_KEY`)
- The **service role key** is different from the **public anon key** - get it from Supabase Dashboard → Project Settings → API → `service_role`

### Teardown not running
- Check `playwright.config.ts` has `globalTeardown: './e2e/global-teardown.ts'`
- Ensure tests complete successfully (teardown only runs after all tests)

### Users/recipes not being deleted
- Verify the email/recipe patterns in cleanup functions match your test data
- Check Supabase dashboard for RLS policies that might prevent deletion
- Ensure service role key has admin privileges

## Best Practices

1. **Use consistent test email patterns**: Stick to `test+*@example.com` format
2. **Don't use real emails**: Always use test patterns to avoid accidental deletion
3. **Review cleanup logs**: Check console output to verify cleanup is working
4. **Soft delete recipes**: We use `deleted_at` to preserve data relationships
5. **Never expose service role key**: Only use in test environment, never in client code

