# Testing Quick Start Guide 🚀

Get started with testing in just a few steps!

## Prerequisites ⚠️

**Important**: Your current Node.js version (v16.14.2) is too old. Upgrade to Node.js 18 or higher:

```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x or higher
```

## Quick Start Steps

### 1. Install Playwright Browsers (After Node.js Upgrade)

```bash
npm run playwright:install
```

### 2. Run Example Unit Tests

```bash
# Watch mode (best for development)
npm test

# Run once
npm run test:unit

# With coverage
npm run test:unit:coverage
```

### 3. Run Example E2E Tests

```bash
# Headless mode
npm run test:e2e

# With UI (visual debugger)
npm run test:e2e:ui

# See the browser (headed mode)
npm run test:e2e:headed
```

## What's Already Set Up? ✅

### Unit Testing (Vitest)

- ✅ Configuration file (`vitest.config.ts`)
- ✅ Test setup with jest-dom matchers
- ✅ React Testing Library integration
- ✅ Custom render with providers
- ✅ Supabase client mocks
- ✅ Example test for auth validation

### E2E Testing (Playwright)

- ✅ Configuration file (`playwright.config.ts`)
- ✅ Page Object Model pattern
- ✅ Base page with common methods
- ✅ Example page objects (SignIn, SignUp, Recipes)
- ✅ Test helpers and fixtures
- ✅ Example auth flow tests

## Project Structure

```
ai-healthy-meal/
├── test/                           # Unit test infrastructure
│   ├── setup.ts                   # Global test setup
│   ├── helpers/
│   │   └── test-utils.tsx        # Custom render with providers
│   └── mocks/
│       └── supabase.mock.ts      # Supabase mocks
├── e2e/                           # E2E test infrastructure
│   ├── page-objects/              # Page Object Model
│   │   ├── BasePage.ts           # Base page class
│   │   ├── SignInPage.ts         # Sign-in page
│   │   ├── SignUpPage.ts         # Sign-up page
│   │   └── RecipesPage.ts        # Recipes page
│   ├── fixtures/
│   │   └── test-data.ts          # Test data
│   ├── helpers/
│   │   └── test-helpers.ts       # Helper functions
│   └── auth.spec.ts              # Example E2E tests
├── src/lib/validation/
│   └── auth.validation.test.ts   # Example unit test
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── README.testing.md             # Full documentation
├── SETUP_SUMMARY.md              # Setup details
└── QUICKSTART_TESTING.md         # This file
```

## Writing Your First Unit Test

Create a test file next to the code you're testing:

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './utils';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

Run it:

```bash
npm test
```

## Writing Your First E2E Test

Create a new spec file in the `e2e/` directory:

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate to homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Healthy Meal/);
});
```

Run it:

```bash
npm run test:e2e
```

## Common Testing Patterns

### Unit Test: React Component

```typescript
import { render, screen } from "@/test/helpers/test-utils";
import { MyComponent } from "./MyComponent";

test("renders component", () => {
  render(<MyComponent title="Hello" />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### Unit Test: With Mock

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

test('calls mock function', () => {
  myFunction(mockFn);
  expect(mockFn).toHaveBeenCalledWith('expected arg');
});
```

### E2E Test: Using Page Object

```typescript
import { SignInPage } from './page-objects/SignInPage';

test('user can sign in', async ({ page }) => {
  const signInPage = new SignInPage(page);
  await signInPage.goto();
  await signInPage.signIn('test@example.com', 'password');
  await expect(page).toHaveURL(/\/recipes/);
});
```

## Useful Commands

### Vitest

```bash
npm test                    # Watch mode
npm run test:unit          # Run once
npm run test:unit:ui       # Visual UI
npm run test:unit:coverage # Coverage report
```

### Playwright

```bash
npm run test:e2e           # Run all tests
npm run test:e2e:ui        # Visual debugger
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Debug mode
```

### Combined

```bash
npm run test:all           # Run both unit and e2e
```

## Viewing Reports

### Unit Test Coverage

After running `npm run test:unit:coverage`, open:

```
coverage/index.html
```

### E2E Test Report

After running `npm run test:e2e`, open:

```
playwright-report/index.html
```

Or view automatically:

```bash
npx playwright show-report
```

## Next Steps

1. ✅ Upgrade Node.js to v18+
2. ✅ Install Playwright: `npm run playwright:install`
3. ✅ Run example tests: `npm test` and `npm run test:e2e`
4. 📝 Write tests for your features
5. 📊 Check coverage: `npm run test:unit:coverage`

## Need Help?

- 📖 Full documentation: `README.testing.md`
- 📋 Test plan: `.ai/test-plan.md`
- 🔧 Setup details: `SETUP_SUMMARY.md`
- 🌐 [Vitest Docs](https://vitest.dev/)
- 🎭 [Playwright Docs](https://playwright.dev/)
- 🧪 [Testing Library](https://testing-library.com/)

## Tips & Tricks

### Vitest

- Press `t` in watch mode to filter tests
- Press `p` to filter by filename
- Press `a` to run all tests
- Press `u` to update snapshots

### Playwright

- Use `page.pause()` to pause execution
- Use `--debug` flag for step-by-step debugging
- Use trace viewer for failed tests: `npx playwright show-trace`
- Use codegen to generate tests: `npx playwright codegen`

## Troubleshooting

### Tests won't run

- Check Node.js version: `node --version` (need 18+)
- Reinstall dependencies: `npm install`

### Playwright browsers not found

- Run: `npm run playwright:install`

### Module resolution errors

- Check path aliases in `vitest.config.ts` match `tsconfig.json`

### Tests timeout

- Increase timeout in test: `test("...", async () => {...}, 10000)`
- Or in config files

Happy Testing! 🎉
