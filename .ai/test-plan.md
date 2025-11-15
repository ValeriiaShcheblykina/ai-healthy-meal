# Test Plan for AI Healthy Meal Application

## 1. Introduction and Testing Objectives

### 1.1 Purpose

This test plan defines the comprehensive testing strategy for the AI Healthy Meal application—a web platform that allows users to manage personalized recipes with AI-powered customization based on dietary preferences, allergens, and calorie goals.

### 1.2 Testing Objectives

- Verify that all authentication flows work correctly with Supabase Auth (sign-up, sign-in, sign-out, password reset)
- Ensure proper authorization and data isolation through Row-Level Security (RLS) policies
- Validate recipe management operations (CRUD) with pagination, search, and sorting
- Test full-text search functionality and query performance
- Verify client-side state management and data caching with TanStack Query
- Ensure responsive UI components render correctly across different viewport sizes
- Validate form inputs and error handling for all user interactions
- Test cookie-based session management and Bearer token authentication
- Verify database constraints, triggers, and indexes function as designed
- Ensure accessibility standards are met (WCAG 2.1 AA)

### 1.3 Scope

**In Scope:**

- Authentication and authorization flows
- Recipe CRUD operations with filtering, sorting, and search
- User profile management
- API endpoints (`/api/auth/*`, `/api/recipes`)
- UI components (forms, lists, cards, toolbars, pagination)
- Database layer (tables, RLS policies, triggers, indexes)
- Middleware authentication logic
- Client-side state management and caching
- Form validation (client and server-side)

**Out of Scope (Future Phases):**

- Recipe variants and AI generation endpoints (not yet implemented)
- Generation logs and analytics
- Public recipe sharing functionality
- Performance testing under load
- AI model integration testing

## 2. Test Scope

### 2.1 Functional Areas

#### Authentication & Authorization

- User registration with email confirmation
- Sign-in with email/password
- Sign-out and session termination
- Forgot password and password reset flows
- Session persistence via cookies
- Bearer token authentication for API clients
- RLS policy enforcement

#### Recipe Management

- Create, read, update, delete recipes
- Pagination with configurable page sizes
- Full-text search across title and content
- Sort by created_at, updated_at, title (asc/desc)
- Soft deletion and exclusion of deleted records
- Owner-only access enforcement

#### User Profile Management

- Display name configuration
- Dietary preference selection (vegan, vegetarian, keto, etc.)
- Allergen list management
- Disliked ingredients configuration
- Calorie target settings

#### UI Components

- Responsive layout across mobile, tablet, desktop
- Form validation with real-time feedback
- Loading states and skeleton loaders
- Empty states for no data scenarios
- Error messages and user feedback
- View toggle (grid/list)
- Dark mode support

### 2.2 Non-Functional Areas

- Security: Authentication, authorization, input sanitization
- Performance: Query response times, index effectiveness
- Usability: Intuitive navigation, clear error messages
- Accessibility: Keyboard navigation, screen reader support, ARIA labels

## 3. Types of Tests

### 3.1 Unit Tests

**Focus:** Individual functions, validation schemas, utility functions

**Coverage:**

- Authentication validation schemas (`src/lib/validation/auth.validation.ts`)
  - Password strength validation (min 8 chars, uppercase, lowercase, number)
  - Email format validation
  - Password confirmation matching
- Recipe query parameter validation (`src/lib/validation/recipe.validation.ts`)
  - Page number validation (≥1)
  - Limit validation (1-100)
  - Sort field validation (created_at, updated_at, title)
  - Order validation (asc, desc)
  - Search query length validation (≤200 chars)
- API error factory functions (`src/lib/errors/api-errors.ts`)
  - Error response formatting
  - Status code assignment
  - Error detail propagation
- Custom hooks (`src/components/hooks/`)
  - `useLocalStorage`: Read/write/update localStorage
  - `useRecipesQuery`: Query parameter construction, cache key generation

**Tools:** Vitest, Testing Library

### 3.2 Integration Tests

**Focus:** Component interactions, API endpoint flows, database operations

**Coverage:**

- Authentication API endpoints (`src/pages/api/auth/`)
  - POST `/api/auth/sign-up`: User creation, duplicate email handling
  - POST `/api/auth/sign-in`: Credential validation, session creation
  - POST `/api/auth/sign-out`: Session termination, cookie clearing
  - POST `/api/auth/forgot-password`: Email sending (always returns success)
  - POST `/api/auth/reset-password`: Password update with valid token
- Recipe API endpoints (`src/pages/api/recipes/`)
  - GET `/api/recipes`: Pagination, search, sorting, authentication
  - Dual authentication support (cookies and Bearer tokens)
- Recipe Service (`src/lib/services/recipe.service.ts`)
  - List recipes with pagination
  - Full-text search integration
  - Soft-delete filtering
  - Database error handling
- Middleware (`src/middleware/index.ts`)
  - Session validation
  - Public path bypass
  - User context injection
  - Redirect logic for unauthenticated users

**Tools:** Vitest, Supertest (for API testing), Supabase test client

### 3.3 End-to-End (E2E) Tests

**Focus:** Complete user workflows across UI and backend

**Critical User Journeys:**

1. **New User Onboarding**
   - Navigate to sign-up page
   - Fill registration form with valid data
   - Submit and verify account creation
   - Redirect to recipes page
   - Verify empty state message

2. **Sign In and Recipe Management**
   - Navigate to sign-in page
   - Enter credentials
   - Sign in successfully
   - Create a new recipe
   - Verify recipe appears in list
   - Edit recipe title
   - Verify update is reflected
   - Delete recipe
   - Verify recipe is removed from list

3. **Recipe Search and Filtering**
   - Sign in as existing user
   - Enter search query in search bar
   - Verify filtered results
   - Change sort order (newest to oldest)
   - Verify recipes reorder
   - Switch view mode (grid to list)
   - Verify view preference persists on refresh

4. **Password Reset Flow**
   - Navigate to forgot password page
   - Enter email address
   - Receive password reset email
   - Click reset link from email
   - Enter new password
   - Submit password reset
   - Sign in with new password

5. **Session Persistence**
   - Sign in to application
   - Close browser tab
   - Reopen application URL
   - Verify user remains signed in
   - Navigate to recipes page without re-authentication

**Tools:** Playwright

### 3.4 Database Tests

**Focus:** Schema integrity, RLS policies, triggers, indexes

**Coverage:**

- **Schema Validation**
  - Table structure matches `database.types.ts`
  - Check constraints enforce valid enum values
  - Foreign key relationships cascade correctly
  - NOT NULL constraints prevent invalid data
  - Default values are applied correctly

- **Row-Level Security (RLS) Policies**
  - Users can only read/write their own recipes
  - Public recipes are readable by anonymous users
  - Soft-deleted recipes are excluded from queries
  - Recipe variants respect parent recipe ownership
  - Generation logs are owner-only readable

- **Triggers**
  - `set_updated_at` trigger updates `updated_at` on row modification
  - Triggers fire on `user_profiles`, `recipes`, `recipe_variants`

- **Indexes**
  - `idx_recipes_user_created_at` improves recipe listing performance
  - `idx_recipes_content_tsv` enables fast full-text search
  - `idx_recipe_variants_recipe_created_at` improves variant queries
  - Partial indexes correctly exclude soft-deleted rows

- **Generated Columns**
  - `content_tsv` on `recipes` table correctly generates tsvector
  - Full-text search queries match expected results

**Tools:** Supabase CLI (local testing), pgTAP (PostgreSQL testing framework), SQL scripts

### 3.5 Security Tests

**Focus:** Authentication bypass, authorization violations, injection attacks

**Coverage:**

- **Authentication Security**
  - Unauthenticated requests to protected endpoints return 401
  - Invalid Bearer tokens are rejected
  - Expired sessions redirect to sign-in
  - Session hijacking prevention (httpOnly, secure cookies)

- **Authorization Security**
  - Users cannot access other users' recipes via direct API calls
  - RLS policies prevent unauthorized data access
  - Recipe ID enumeration is prevented

- **Input Validation**
  - SQL injection attempts in search queries
  - XSS attempts in recipe content fields
  - CSRF protection for state-changing operations
  - Maximum length validation for all text inputs

- **Password Security**
  - Password hashing (handled by Supabase Auth)
  - Password strength requirements enforced
  - Reset tokens expire after use
  - Rate limiting on authentication endpoints

**Tools:** OWASP ZAP, Manual penetration testing, Burp Suite

### 3.6 Accessibility Tests

**Focus:** WCAG 2.1 AA compliance, keyboard navigation, screen reader support

**Coverage:**

- Keyboard navigation for all interactive elements
- Focus indicators visible on all focusable elements
- Form labels properly associated with inputs
- Error messages announced to screen readers
- Color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- Alt text for images (if any)
- ARIA labels for icon buttons
- Semantic HTML structure (headings, landmarks)

**Tools:** axe DevTools, Lighthouse, NVDA/JAWS screen readers, Keyboard-only navigation testing

### 3.7 Performance Tests

**Focus:** Query response times, rendering performance, bundle size

**Coverage:**

- Recipe list endpoint responds in <500ms for 20 items
- Full-text search completes in <300ms
- Initial page load <3s on 3G connection
- JavaScript bundle size <500KB (gzipped)
- Images optimized and lazy-loaded
- Database queries use indexes effectively (verify with EXPLAIN ANALYZE)

**Tools:** Lighthouse, WebPageTest, Chrome DevTools Performance tab, PostgreSQL EXPLAIN

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication Scenarios

#### Sign-Up (POST `/api/auth/sign-up`)

| Scenario                | Input                                      | Expected Result                                    |
| ----------------------- | ------------------------------------------ | -------------------------------------------------- |
| Valid registration      | Valid email, strong password, display name | 200 OK, user created, session established          |
| Duplicate email         | Existing email address                     | 400 Bad Request, error: "Email already registered" |
| Weak password           | Password with <8 chars                     | 400 Bad Request, validation error                  |
| Missing required fields | Email only, no password                    | 400 Bad Request, validation error                  |
| Invalid email format    | "notanemail"                               | 400 Bad Request, validation error                  |
| Password mismatch       | password ≠ confirmPassword                 | 400 Bad Request, validation error                  |

#### Sign-In (POST `/api/auth/sign-in`)

| Scenario          | Input                         | Expected Result                                     |
| ----------------- | ----------------------------- | --------------------------------------------------- |
| Valid credentials | Correct email & password      | 200 OK, session cookies set, redirect to `/recipes` |
| Invalid email     | Non-existent email            | 400 Bad Request, error: "Invalid email or password" |
| Wrong password    | Correct email, wrong password | 400 Bad Request, error: "Invalid email or password" |
| Empty fields      | Missing email or password     | 400 Bad Request, validation error                   |

#### Forgot Password (POST `/api/auth/forgot-password`)

| Scenario             | Input              | Expected Result                           |
| -------------------- | ------------------ | ----------------------------------------- |
| Valid email          | Registered email   | 200 OK, reset email sent (if exists)      |
| Non-existent email   | Unregistered email | 200 OK, always returns success (security) |
| Invalid email format | "notanemail"       | 400 Bad Request, validation error         |

#### Reset Password (POST `/api/auth/reset-password`)

| Scenario               | Input                                  | Expected Result                              |
| ---------------------- | -------------------------------------- | -------------------------------------------- |
| Valid token & password | Valid reset token, new strong password | 200 OK, password updated                     |
| Expired token          | Token older than 1 hour                | 400 Bad Request, error: "Reset link expired" |
| Weak new password      | Password with <8 chars                 | 400 Bad Request, validation error            |
| Password mismatch      | password ≠ confirmPassword             | 400 Bad Request, validation error            |

### 4.2 Recipe Management Scenarios

#### List Recipes (GET `/api/recipes`)

| Scenario                | Query Params           | Expected Result                                                |
| ----------------------- | ---------------------- | -------------------------------------------------------------- |
| Default listing         | None                   | 200 OK, first 20 recipes, sorted by created_at desc            |
| Pagination              | `page=2&limit=10`      | 200 OK, recipes 11-20, pagination metadata                     |
| Search by title         | `search=pasta`         | 200 OK, recipes with "pasta" in title or content               |
| Sort by title           | `sort=title&order=asc` | 200 OK, recipes sorted alphabetically                          |
| Invalid page number     | `page=-1`              | 400 Bad Request, validation error                              |
| Limit exceeds max       | `limit=200`            | 400 Bad Request, validation error: "must be between 1 and 100" |
| Unauthenticated request | No session/token       | 401 Unauthorized                                               |
| Bearer token auth       | Valid token in header  | 200 OK, recipes for token owner                                |

#### Create Recipe (Future Implementation)

| Scenario              | Input                      | Expected Result                       |
| --------------------- | -------------------------- | ------------------------------------- |
| Valid recipe          | Title, content             | 201 Created, recipe returned          |
| Missing title         | Content only               | 400 Bad Request, validation error     |
| Neither content field | No content or content_json | 400 Bad Request, constraint violation |

### 4.3 User Profile Scenarios

#### Update Profile (Future Implementation)

| Scenario                | Input                                 | Expected Result                       |
| ----------------------- | ------------------------------------- | ------------------------------------- |
| Valid preferences       | diet: "vegan", allergens: ["peanuts"] | 200 OK, profile updated               |
| Invalid diet type       | diet: "invalid"                       | 400 Bad Request, constraint violation |
| Negative calorie target | calorie_target: -1000                 | 400 Bad Request, constraint violation |

### 4.4 UI Component Scenarios

#### RecipesList Component

| Scenario     | Interaction       | Expected Result                                             |
| ------------ | ----------------- | ----------------------------------------------------------- |
| Initial load | Component mounts  | Skeleton loader shown, then recipes rendered                |
| Empty state  | No recipes exist  | EmptyState component shown with message                     |
| Search input | Type "chicken"    | Debounced API call, filtered results shown                  |
| View toggle  | Click list icon   | View changes to list mode, preference saved to localStorage |
| Pagination   | Click "Next Page" | Page increments, URL updates, new recipes loaded            |
| Error state  | API returns 500   | Error message shown with retry button                       |

#### Authentication Forms

| Scenario                   | Interaction        | Expected Result                                   |
| -------------------------- | ------------------ | ------------------------------------------------- |
| Password visibility toggle | Click eye icon     | Password input toggles between text/password type |
| Real-time validation       | Type invalid email | Red error message appears below field             |
| Submit loading state       | Click submit       | Button disabled, spinner shown                    |
| Server error               | API returns error  | Error banner shown above form                     |

## 5. Test Environment

### 5.1 Development Environment

- **OS:** macOS 24.2.0, Linux (Ubuntu 22.04), Windows 11
- **Node.js:** v22.14.0 (as per `.nvmrc`)
- **Package Manager:** npm
- **Local Database:** Supabase Local Development (Docker-based PostgreSQL)
- **Browser:** Chrome (latest), Firefox (latest), Safari (latest)

### 5.2 Staging Environment

- **Hosting:** Vercel or Netlify (SSR enabled)
- **Database:** Supabase Cloud (staging project)
- **Environment Variables:** `.env.staging` with non-production credentials
- **URL:** `https://staging.ai-healthy-meal.app` (example)

### 5.3 Production Environment

- **Hosting:** Vercel or Netlify with CDN
- **Database:** Supabase Cloud (production project)
- **Monitoring:** Sentry for error tracking, Vercel Analytics
- **URL:** `https://ai-healthy-meal.app` (example)

## 6. Testing Tools

### 6.1 Unit & Integration Testing

- **Vitest:** Fast unit testing framework for TypeScript/JavaScript
- **Testing Library (React, Astro):** Component testing with user-centric queries
- **MSW (Mock Service Worker):** API mocking for integration tests
- **@supabase/gotrue-js:** Mock Supabase Auth client for testing

### 6.2 End-to-End Testing

- **Playwright:** Cross-browser E2E testing (recommended for Astro)
- **Supabase Test Helpers:** Helper utilities for seeding test data

### 6.3 Database Testing

- **Supabase CLI:** Local database management and migration testing
- **pgTAP:** PostgreSQL testing framework for RLS policies and triggers
- **SQL Scripts:** Custom SQL for testing constraints and indexes

### 6.4 Code Quality & Linting

- **ESLint:** TypeScript, React, Astro linting (already configured)
- **Prettier:** Code formatting (already configured)
- **TypeScript Compiler:** Type checking (`tsc --noEmit`)
- **Husky + lint-staged:** Pre-commit hooks (already configured)

### 6.5 Accessibility Testing

- **axe DevTools:** Browser extension for accessibility audits
- **Lighthouse:** Built-in Chrome DevTools accessibility scoring
- **Pa11y:** Automated accessibility testing CLI
- **NVDA/JAWS:** Screen reader testing on Windows
- **VoiceOver:** Screen reader testing on macOS

### 6.6 Security Testing

- **OWASP ZAP:** Automated security vulnerability scanner
- **npm audit:** Dependency vulnerability scanning
- **Snyk:** Continuous security monitoring
- **Manual Testing:** Penetration testing for authentication flows

### 6.7 Performance Testing

- **Lighthouse:** Performance, accessibility, best practices scoring
- **WebPageTest:** Real-world performance testing
- **Chrome DevTools:** Network, performance profiling
- **PostgreSQL EXPLAIN ANALYZE:** Query performance analysis

## 7. Test Schedule

### Phase 1: Setup & Unit Tests (Week 1-2)

- Set up testing infrastructure (Vitest, Playwright, pgTAP)
- Write unit tests for validation schemas
- Write unit tests for utility functions and hooks
- Set up CI/CD pipeline with GitHub Actions
- **Target:** 80% unit test coverage

### Phase 2: Integration Tests (Week 3-4)

- Test authentication API endpoints
- Test recipe API endpoints
- Test middleware authentication logic
- Test service layer (RecipeService)
- Mock Supabase client for integration tests
- **Target:** All API endpoints covered

### Phase 3: Database Tests (Week 5)

- Test RLS policies for all tables
- Test triggers (updated_at)
- Test check constraints (diet, action enums)
- Test indexes with EXPLAIN ANALYZE
- Test full-text search functionality
- **Target:** All RLS policies verified, query performance validated

### Phase 4: E2E Tests (Week 6-7)

- Write E2E tests for critical user journeys
- Test across Chrome, Firefox, Safari
- Test responsive layouts (mobile, tablet, desktop)
- Test error scenarios and edge cases
- **Target:** 5 critical user journeys automated

### Phase 5: Security & Accessibility (Week 8)

- Run OWASP ZAP automated scans
- Manual penetration testing for auth flows
- Run axe DevTools audits on all pages
- Test keyboard navigation
- Test screen reader compatibility
- **Target:** No critical security issues, WCAG AA compliance

### Phase 6: Performance Testing (Week 9)

- Run Lighthouse audits (target: >90 score)
- Measure API response times (target: <500ms)
- Optimize slow queries with indexes
- Test bundle size (target: <500KB gzipped)
- **Target:** Performance metrics meet thresholds

### Phase 7: Regression & UAT (Week 10)

- Run full test suite before releases
- User Acceptance Testing with stakeholders
- Fix critical bugs identified
- Document known issues
- **Target:** Zero critical/high bugs before production release

## 8. Test Acceptance Criteria

### 8.1 Coverage Criteria

- **Unit Tests:** ≥80% code coverage for validation and utility functions
- **Integration Tests:** 100% API endpoint coverage
- **E2E Tests:** All critical user journeys automated (5+ scenarios)
- **Database Tests:** All RLS policies validated, all triggers tested

### 8.2 Quality Criteria

- **Zero Critical Bugs:** No P0/P1 bugs in production release
- **Security:** No high/critical vulnerabilities in dependencies or code
- **Accessibility:** WCAG 2.1 AA compliance (axe score 100)
- **Performance:**
  - Lighthouse score ≥90
  - Recipe list API <500ms response time
  - Initial page load <3s on 3G

### 8.3 Test Pass Criteria

- All unit tests pass in CI/CD pipeline
- All integration tests pass with mocked Supabase client
- All E2E tests pass in staging environment
- All database tests pass in local and staging environments
- Security scans show no critical/high issues
- Accessibility audits show no violations
- Performance benchmarks meet targets

### 8.4 Exit Criteria

- Test coverage meets defined thresholds
- All acceptance criteria met
- Regression testing completed successfully
- User acceptance testing approved by stakeholders
- Production deployment checklist completed

## 9. Roles and Responsibilities

### 9.1 QA Engineer

- Design and execute test plans
- Write and maintain automated tests
- Perform manual testing for exploratory scenarios
- Report and track bugs in issue tracker
- Verify bug fixes before closure
- Coordinate UAT with stakeholders

### 9.2 Frontend Developer

- Write unit tests for React components and hooks
- Fix UI bugs identified during testing
- Ensure accessibility standards in component development
- Optimize frontend performance based on test results

### 9.3 Backend Developer

- Write integration tests for API endpoints
- Write database tests for RLS policies and triggers
- Fix backend bugs identified during testing
- Optimize database queries based on performance tests

### 9.4 DevOps Engineer

- Set up CI/CD pipeline for automated testing
- Configure staging and production environments
- Set up monitoring and alerting (Sentry, Vercel Analytics)
- Manage Supabase projects (staging, production)

### 9.5 Product Owner

- Approve test scenarios based on requirements
- Participate in UAT
- Prioritize bugs and feature fixes
- Sign off on production releases

## 10. Defect Reporting Procedures

### 10.1 Bug Severity Levels

- **P0 (Critical):** Application crash, data loss, security breach, complete feature failure
- **P1 (High):** Major feature broken, workaround exists but difficult
- **P2 (Medium):** Minor feature broken, workaround easy, cosmetic issues
- **P3 (Low):** Nice-to-have, minor improvements, edge cases

### 10.2 Bug Report Template

```markdown
**Title:** Clear, concise description of the issue

**Environment:**

- OS: [macOS 24.2.0 / Windows 11 / Linux]
- Browser: [Chrome 120.0.6099.109]
- Device: [Desktop / Mobile]
- Environment: [Development / Staging / Production]

**Severity:** [P0 / P1 / P2 / P3]

**Steps to Reproduce:**

1. Navigate to [URL]
2. Click [Button]
3. Enter [Data]
4. Observe [Issue]

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Screenshots/Videos:**
Attach evidence

**Console Errors:**
Paste any browser console errors

**Additional Context:**

- User role: [Authenticated / Anonymous]
- Recipe ID: [UUID]
- Error message: [Text]
```

### 10.3 Bug Workflow

1. **Report:** QA creates bug in issue tracker (GitHub Issues, Jira)
2. **Triage:** Team reviews severity and assigns priority
3. **Assignment:** Bug assigned to developer
4. **Fix:** Developer fixes bug and updates status
5. **Verification:** QA verifies fix in appropriate environment
6. **Closure:** Bug marked as resolved after verification
7. **Regression Test:** Add test case to prevent future regressions

### 10.4 Bug Tracking

- **Tool:** GitHub Issues with labels (bug, P0, P1, P2, P3, needs-reproduction, verified)
- **Frequency:** Daily triage meetings during active development
- **Metrics:** Track bug velocity (opened vs. closed per sprint)
- **Dashboard:** Maintain bug dashboard for transparency

---

## Appendix A: Test Data Requirements

### A.1 User Test Accounts

- **Valid User:** `test+valid@example.com` / `Test123!@#`
- **Admin User (Future):** `test+admin@example.com` / `Admin123!@#`
- **Multiple Users:** Generate 10 test accounts for multi-user scenarios

### A.2 Recipe Test Data

- **Sample Recipes:** 50 recipes with varied titles, content, and dates
- **Search Test Data:** Recipes with keywords like "chicken", "vegan", "pasta"
- **Edge Cases:** Very long titles (>200 chars), empty content_json, special characters

### A.3 Database Seed Scripts

- Create SQL script to populate test data in local Supabase instance
- Include users, recipes, profiles with varied dietary preferences
- Reset script to restore clean state between test runs

---

## Appendix B: CI/CD Pipeline Configuration

### B.1 GitHub Actions Workflow

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: supabase start
      - run: npm run test:db
      - run: npm run test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### B.2 Pre-Deployment Checks

- All tests pass in CI/CD
- No ESLint errors or warnings
- TypeScript compilation succeeds
- Lighthouse score ≥90
- No high/critical security vulnerabilities

---

## Appendix C: Risk Assessment

### High-Risk Areas Requiring Extra Testing

1. **Authentication & Session Management**
   - Risk: Session hijacking, unauthorized access
   - Mitigation: Comprehensive security testing, penetration testing

2. **Row-Level Security (RLS) Policies**
   - Risk: Data leakage between users
   - Mitigation: Exhaustive RLS policy testing with multiple user scenarios

3. **Full-Text Search**
   - Risk: SQL injection, performance degradation
   - Mitigation: Input sanitization testing, query performance benchmarking

4. **Password Reset Flow**
   - Risk: Token reuse, account takeover
   - Mitigation: Token expiration testing, replay attack testing

5. **Soft Deletion Logic**
   - Risk: Deleted recipes appearing in queries
   - Mitigation: Query testing with soft-deleted data, index validation
