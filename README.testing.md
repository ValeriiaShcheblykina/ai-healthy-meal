# Testing Documentation

This project uses **Vitest** for unit tests and **Playwright** for end-to-end (e2e) tests.

## Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

## Setup

### Prerequisites

- Node.js >= 18.0.0 (required for Playwright and Vitest)
- npm >= 9.6.5

### Install Dependencies

All testing dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Install Playwright Browsers

Playwright requires browser binaries. Install Chromium:

```bash
npm run playwright:install
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests once
npm run test:unit

# Run tests in watch mode (recommended for development)
npm run test:unit:watch

# Run tests with UI (visual test runner)
npm run test:unit:ui

# Run tests with coverage report
npm run test:unit:coverage

# Run tests (default watch mode)
npm test
```

### E2E Tests (Playwright)

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI mode (visual debugger)
npm run test:e2e:ui

# Run e2e tests in headed mode (see browser)
npm run test:e2e:headed

# Run e2e tests in debug mode
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

## Unit Testing with Vitest

### Configuration

Unit tests are configured in `vitest.config.ts`:

- **Environment**: jsdom (simulates browser environment)
- **Setup File**: `test/setup.ts` (global test setup)
- **Coverage Threshold**: 80% for lines, functions, branches, and statements

### File Naming Convention

- `*.test.ts` or `*.spec.ts` for test files
- Place test files next to the code they test or in `test/` directory

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from './auth.validation';

describe('validateEmail', () => {
  it('should validate a correct email format', () => {
    const result = validateEmail('test@example.com');
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const result = validateEmail('notanemail');
    expect(result.success).toBe(false);
  });
});
```

### Testing React Components

Use the custom render function from `test/helpers/test-utils.tsx`:

```typescript
import { render, screen } from "@/test/helpers/test-utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
```

### Mocking

#### Mock Functions

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
```

#### Mock Modules

```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));
```

#### Mock Supabase Client

Use the mock from `test/mocks/supabase.mock.ts`:

```typescript
import { createMockSupabaseClient } from '@/test/mocks/supabase.mock';

const mockClient = createMockSupabaseClient();
```

## E2E Testing with Playwright

### Configuration

E2E tests are configured in `playwright.config.ts`:

- **Test Directory**: `./e2e`
- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: `http://localhost:3000`
- **Dev Server**: Automatically starts before tests

### File Naming Convention

- `*.spec.ts` for test files in the `e2e/` directory

### Page Object Model

Use Page Object Model (POM) for maintainable tests. Page objects are in `e2e/page-objects/`:

```typescript
import { test, expect } from '@playwright/test';
import { SignInPage } from './page-objects/SignInPage';

test('should sign in successfully', async ({ page }) => {
  const signInPage = new SignInPage(page);
  await signInPage.goto();
  await signInPage.signIn('test@example.com', 'Test123!@#');
  await expect(page).toHaveURL(/\/recipes/);
});
```

### Creating a New Page Object

Extend `BasePage` for common functionality:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: /my button/i });
  }

  async goto() {
    await super.goto('/my-page');
  }

  async clickMyButton() {
    await this.click(this.myButton);
  }
}
```

### Test Data and Helpers

- **Test Data**: Use fixtures from `e2e/fixtures/test-data.ts`
- **Helpers**: Use helper functions from `e2e/helpers/test-helpers.ts`

## Writing Tests

### Unit Test Guidelines

1. **Test in isolation**: Mock external dependencies
2. **Use descriptive names**: Test names should describe expected behavior
3. **Arrange-Act-Assert pattern**: Structure tests clearly
4. **One assertion per test**: Keep tests focused
5. **Test edge cases**: Include boundary conditions and error scenarios

### E2E Test Guidelines

1. **Use Page Objects**: Encapsulate page interactions
2. **Test user workflows**: Focus on complete user journeys
3. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText`
4. **Wait for elements**: Use proper waiting strategies (avoid hardcoded timeouts)
5. **Test in isolation**: Each test should be independent
6. **Clean up after tests**: Reset state between tests

## Best Practices

### Vitest Best Practices

- **Use `vi` object for mocks**: `vi.fn()`, `vi.spyOn()`, `vi.mock()`
- **Place mocks at top level**: Mock factories run before imports
- **Use inline snapshots**: `expect(value).toMatchInlineSnapshot()`
- **Monitor coverage with purpose**: Focus on meaningful tests, not arbitrary percentages
- **Use watch mode during development**: `npm run test:unit:watch`

### Playwright Best Practices

- **Initialize with Chromium only**: As per project guidelines
- **Use browser contexts**: Isolate test environments
- **Implement Page Object Model**: For maintainable tests
- **Use locators for resilient selection**: Avoid CSS selectors when possible
- **Leverage API testing**: For backend validation
- **Use trace viewer for debugging**: `npx playwright show-trace`
- **Implement test hooks**: Use `beforeEach`, `afterEach` for setup/teardown
- **Use expect assertions with specific matchers**: `toBeVisible()`, `toHaveText()`, etc.

### General Best Practices

- **Keep tests fast**: Mock slow operations in unit tests
- **Write tests first (TDD)**: Define expected behavior before implementation
- **Test behavior, not implementation**: Focus on what, not how
- **Maintain test data separately**: Use fixtures and factories
- **Use descriptive variable names**: Make tests self-documenting
- **Group related tests**: Use `describe` blocks
- **Handle async operations properly**: Use `async/await`
- **Clean up resources**: Close connections, clear mocks

## Coverage Reports

View coverage reports after running:

```bash
npm run test:unit:coverage
```

Open `coverage/index.html` in your browser to see detailed coverage report.

## Continuous Integration

Tests run automatically on:

- Pull requests to `main` branch
- Push to `main` and `develop` branches

CI configuration is in `.github/workflows/test.yml` (to be created).

## Troubleshooting

### Vitest Issues

**Problem**: Tests fail with module resolution errors
**Solution**: Check `vitest.config.ts` alias configuration matches `tsconfig.json`

**Problem**: DOM not available in tests
**Solution**: Ensure `environment: 'jsdom'` is set in `vitest.config.ts`

### Playwright Issues

**Problem**: Browsers not installed
**Solution**: Run `npm run playwright:install`

**Problem**: Tests timeout
**Solution**: Increase timeout in `playwright.config.ts` or check if dev server is running

**Problem**: Test fails only in CI
**Solution**: Check for race conditions, use proper wait strategies

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Test Plan](./.ai/test-plan.md)

## Support

For questions or issues with testing:

1. Check this documentation
2. Review the test plan in `.ai/test-plan.md`
3. Check existing tests for examples
4. Consult Vitest/Playwright documentation
