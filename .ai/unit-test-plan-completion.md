# Unit Test Coverage Analysis & Test Plan

## Current Coverage Summary

**Overall Coverage:**
- Statements: 93.28% (472/506)
- Branches: 80.68% (284/352) ⚠️ **Needs improvement**
- Functions: 95.08% (58/61)
- Lines: 93.38% (466/499)

**Coverage by Module:**
- `components/auth`: 100% ✅
- `components/recipes`: 100% ✅
- `components/ui`: 100% ✅
- `lib/api`: 100% ✅
- `lib/errors`: 87.5% (14/16 statements, 2 functions missing)
- `lib/validation`: 86.81% (79/91 statements, 13 missing)
- `pages/api/auth`: 96.02% (145/151 statements, 20 branches missing)
- `pages/api/recipes`: 90.9% (140/154 statements, 29 branches missing)

---

## Priority 1: Critical Infrastructure (High Priority)

### ✅ COVERED Files

#### 1.1 Error Handling ✅
- **File:** `lib/errors/api-errors.ts`
- **Test File:** `test/lib/errors/api-errors.test.ts` ✅ **CREATED**
- **Status:** Complete
- **Coverage:**
  - ✅ `ERROR_CODES` constants - All codes exported and tested
  - ✅ `ApiError` class - Instantiation with/without details
  - ✅ `createErrorResponse()` - With and without details
  - ✅ `createUnauthorizedError()` - Default and custom messages
  - ✅ `createForbiddenError()` - Default and custom messages
  - ✅ `createValidationError()` - With and without details
  - ✅ `createInternalError()` - Default and custom messages
  - ✅ `createNotFoundError()` - Default and custom messages
  - ✅ `createApiErrorResponse()` - With ApiError instance
  - ✅ `createApiErrorResponse()` - With plain error object
  - ✅ Error response formatting - With and without details
  - ✅ Edge cases - Empty strings, long messages, complex details
  - ✅ Integration tests - All error types with createApiErrorResponse

#### 1.2 Recipe Validation ✅
- **File:** `lib/validation/recipe.validation.ts`
- **Test File:** `test/lib/validation/recipe.validation.test.ts` ✅ **CREATED**
- **Status:** Complete
- **Coverage:**
  - ✅ `validateRecipeListQueryParams()` - All edge cases covered
  - ✅ `validateRecipeData()` - All validation paths covered
  - ✅ `validateRecipeVariantListQueryParams()` - Complete coverage
  - ✅ Invalid order parameter validation
  - ✅ Search query length validation
  - ✅ Invalid title/content type validation
  - ✅ Empty content trimming
  - ✅ Content length validation
  - ✅ Invalid content_json type validation
  - ✅ Invalid is_public type validation
  - ✅ Create operation without content validation

#### 1.3 Recipe Service ✅
- **File:** `lib/services/recipe.service.ts`
- **Test File:** `test/lib/services/recipe.service.test.ts` ✅ **CREATED**
- **Status:** Complete
- **Coverage:**
  - ✅ `listRecipes()` - Pagination, search, error handling
  - ✅ `getRecipe()` - Success and error cases
  - ✅ `createRecipe()` - Success and error handling
  - ✅ `updateRecipe()` - Partial updates and errors
  - ✅ `deleteRecipe()` - Soft delete functionality
  - ✅ `listRecipeVariants()` - Pagination and sorting
  - ✅ `getRecipeVariant()` - Success and error cases
  - ✅ `deleteRecipeVariant()` - Soft delete functionality

#### 1.4 OpenRouter Service ✅
- **File:** `lib/services/openrouter.service.ts`
- **Test File:** `test/lib/services/openrouter.service.test.ts` ✅ **CREATED**
- **Status:** Complete
- **Coverage:**
  - ✅ Constructor validation
  - ✅ `validateMessages()` - All validation paths
  - ✅ `buildRequestPayload()` - All parameter combinations
  - ✅ `handleApiError()` - All HTTP status codes
  - ✅ `sendRequest()` - Retry logic, timeouts, network errors
  - ✅ `parseResponse()` - Valid responses and JSON schema
  - ✅ `chatCompletion()` - Success and error scenarios
  - ✅ `chatCompletionWithSchema()` - JSON schema handling
  - ✅ `listModels()` - Success and error cases
  - ✅ `generateRecipeFromExisting()` - All scenarios

### ❌ UNCOVERED Files (Priority 1)

None - All Priority 1 files are now covered! ✅

---

## Priority 2: Service Layer & Client Services (Medium Priority)

### ✅ COVERED Files

None yet - all Priority 2 files are uncovered.

### ❌ UNCOVERED Files (Priority 2)

#### 2.1 Client Services ❌
- **Files:**
  - `lib/services/client/recipes.client.service.ts` ❌
  - `lib/services/client/profile.client.service.ts` ❌
  - `lib/services/client/api-client.helper.ts` ❌
- **Test Files:** Not created
- **Test Plan:**
  - [ ] Test `RecipesClientService`
    - [ ] `listRecipes()` success and error cases
    - [ ] `getRecipe()` success and error cases
    - [ ] `createRecipe()` success and error cases
    - [ ] `updateRecipe()` success and error cases
    - [ ] `deleteRecipe()` success and error cases
  - [ ] Test `ProfileClientService`
    - [ ] `getProfile()` success and error cases
    - [ ] `updateProfile()` success and error cases
  - [ ] Test `ApiClientHelper`
    - [ ] Request building
    - [ ] Error handling
    - [ ] Authentication header handling

**Files to Create:**
- `test/lib/services/client/recipes.client.service.test.ts`
- `test/lib/services/client/profile.client.service.test.ts`
- `test/lib/services/client/api-client.helper.test.ts`

---

## Priority 3: Hooks & Utilities (Medium Priority)

### ✅ COVERED Files

#### 3.1 React Hooks ✅
- **Files:**
  - `components/hooks/useLocalStorage.ts` ✅
  - `components/hooks/useRecipesQuery.ts` ✅
- **Test Files:**
  - `test/components/hooks/useLocalStorage.test.ts` ✅ **CREATED**
  - `test/components/hooks/useRecipesQuery.test.tsx` ✅ **CREATED**
- **Status:** Complete
- **Coverage:**
  - ✅ `useLocalStorage()` hook
    - ✅ Initial value handling (strings, numbers, objects, arrays)
    - ✅ Reading from localStorage
    - ✅ Writing to localStorage
    - ✅ Error handling (invalid JSON, quota exceeded, generic errors)
    - ✅ SSR safety (window undefined handling)
    - ✅ Multiple instances with different keys
    - ✅ Multiple instances with same key
  - ✅ `useRecipesQuery()` hook
    - ✅ Query execution with parameters
    - ✅ Successful query with data
    - ✅ Query error handling
    - ✅ Caching behavior
    - ✅ Separate cache entries for different parameters
    - ✅ Retry logic for auth errors (no retry)
    - ✅ Retry logic for other errors (retries up to 3 times)
    - ✅ Query key generation

#### 3.2 Utility Functions ✅
- **Files:**
  - `lib/utils.ts` ✅
  - `lib/api/parse-request-body.ts` ✅
- **Test Files:**
  - `test/lib/utils.test.ts` ✅ **CREATED**
  - `test/lib/api/parse-request-body.test.ts` ✅ **CREATED**
- **Status:** Complete
- **Coverage:**
  - ✅ `cn()` utility function (class name merging)
    - ✅ Basic class merging
    - ✅ Tailwind class conflict resolution
    - ✅ Conditional classes
    - ✅ Array and object inputs
    - ✅ Edge cases (empty input, falsy values, whitespace)
    - ✅ Real-world scenarios (button components, responsive classes)
  - ✅ `parseJsonBody()` function
    - ✅ Valid JSON parsing (objects, arrays, primitives, nested structures)
    - ✅ Invalid JSON handling (malformed, incomplete, trailing commas)
    - ✅ Empty body handling
    - ✅ Non-JSON content types
    - ✅ Edge cases (large objects, special characters, escaped characters)
    - ✅ Error message validation

### ❌ UNCOVERED Files (Priority 3)

None - All Priority 3 files are now covered! ✅

---

## Priority 4: React Components (Lower Priority)

### ✅ COVERED Files

#### 4.1 Auth Components ✅
- **Files:**
  - `components/auth/PasswordInput.tsx` ✅
  - `components/auth/SignUpForm.tsx` ✅
- **Test Files:**
  - `test/components/auth/PasswordInput.test.tsx` ✅
  - `test/components/auth/SignUpForm.test.tsx` ✅

#### 4.2 Recipe Components ✅
- **Files:**
  - `components/recipes/PaginationControls.tsx` ✅
- **Test Files:**
  - `test/components/recipes/PaginationControls.test.tsx` ✅

### ❌ UNCOVERED Files (Priority 4)

#### 4.3 Auth Components ❌
- **Files:**
  - `components/auth/FormField.tsx` ❌
  - `components/auth/SignInForm.tsx` ❌
  - `components/auth/ForgotPasswordForm.tsx` ❌
  - `components/auth/ResetPasswordForm.tsx` ❌
- **Test Files:** Not created

#### 4.4 Profile Components ❌
- **Files:**
  - `components/profile/ProfileForm.tsx` ❌
- **Test Files:** Not created

#### 4.5 Recipe Components ❌
- **Files:**
  - `components/recipes/RecipeForm.tsx` ❌
  - `components/recipes/RecipeCard.tsx` ❌
  - `components/recipes/RecipeListItem.tsx` ❌
  - `components/recipes/RecipeDetailView.tsx` ❌
  - `components/recipes/RecipeCreateView.tsx` ❌
  - `components/recipes/RecipeEditView.tsx` ❌
  - `components/recipes/GenerateRecipeButton.tsx` ❌
  - `components/recipes/GenerateRecipeVariantButton.tsx` ❌
  - `components/recipes/AIGenerationDrawer.tsx` ❌
  - `components/recipes/VariantList.tsx` ❌
  - `components/recipes/VariantDetailView.tsx` ❌
  - `components/recipes/DeleteRecipeDialog.tsx` ❌
  - `components/recipes/DeleteVariantDialog.tsx` ❌
  - `components/recipes/MetadataDisplay.tsx` ❌
  - `components/recipes/EmptyState.tsx` ❌
  - `components/recipes/RecipesGrid.tsx` ❌
  - `components/recipes/RecipesList.tsx` ❌
  - `components/recipes/RecipesListItems.tsx` ❌
  - `components/recipes/RecipesToolbar.tsx` ❌
  - `components/recipes/SearchBar.tsx` ❌
  - `components/recipes/SkeletonLoader.tsx` ❌
  - `components/recipes/SortDropdown.tsx` ❌
  - `components/recipes/ViewToggle.tsx` ❌
- **Test Files:** Not created

#### 4.6 Other Components ❌
- **Files:**
  - `components/GenerateRecipeFromPreferences.tsx` ❌
  - `components/ThemeToggle.tsx` ❌
- **Test Files:** Not created

**Test Plan:**
Focus on:
- User interactions (clicks, form submissions)
- Form validation
- Error state handling
- Loading states
- Props validation
- Event handlers

**Priority Order:**
1. Forms (RecipeForm, ProfileForm, SignInForm, etc.)
2. Main views (RecipeDetailView, RecipeCreateView, RecipeEditView)
3. Dialogs (DeleteRecipeDialog, DeleteVariantDialog)
4. Display components (RecipeCard, MetadataDisplay)
5. Utility components (SearchBar, SortDropdown, ViewToggle)

---

## Priority 5: API Endpoint Edge Cases (Enhancement)

### ✅ COVERED Files

#### 5.1 Auth API Endpoints ✅
- **Files:**
  - `pages/api/auth/sign-up.ts` ✅
  - `pages/api/auth/sign-in.ts` ✅
  - `pages/api/auth/sign-out.ts` ✅
  - `pages/api/auth/me.ts` ✅
  - `pages/api/auth/profile.ts` ✅
  - `pages/api/auth/forgot-password.ts` ✅
  - `pages/api/auth/reset-password.ts` ✅
- **Test Files:** All have corresponding `.test.ts` files ✅
- **Coverage:** 96.02% (145/151 statements, 20 branches missing)

#### 5.2 Recipes API Endpoints ✅
- **Files:**
  - `pages/api/recipes/index.ts` ✅
  - `pages/api/recipes/[id].ts` ✅
  - `pages/api/recipes/ai-generation.ts` ✅
  - `pages/api/recipes/[recipeId]/variants/index.ts` ✅
  - `pages/api/recipes/[recipeId]/variants/[variantId].ts` ✅
- **Test Files:** All have corresponding `.test.ts` files ✅
- **Coverage:** 90.9% (140/154 statements, 29 branches missing)

#### 5.3 OpenRouter API Endpoints ✅
- **Files:**
  - `pages/api/openrouter/generate-variant.ts` ✅
- **Test Files:** Has corresponding `.test.ts` file ✅

### ❌ UNCOVERED Edge Cases (Priority 5)

**Missing Coverage:**
- ❌ Edge cases in authentication flows
- ❌ Error handling for network failures
- ❌ Boundary conditions
- ❌ Variant endpoint edge cases
- ❌ AI generation endpoint error scenarios
- ❌ Pagination boundary conditions

**Test Plan:**
- [ ] Add tests for edge cases in existing auth endpoints
- [ ] Test concurrent request handling
- [ ] Test session expiration scenarios
- [ ] Test rate limiting scenarios
- [ ] Test variant endpoints with invalid IDs
- [ ] Test AI generation with invalid prompts
- [ ] Test pagination with edge values (page 0, negative, very large)
- [ ] Test concurrent recipe operations

---

## Summary by Priority

### Priority 1: Critical Infrastructure
- **Covered:** 4/4 files (100%) ✅
  - ✅ `api-errors.ts`
  - ✅ `recipe.validation.ts`
  - ✅ `recipe.service.ts`
  - ✅ `openrouter.service.ts`
- **Uncovered:** 0/4 files (0%)

### Priority 2: Service Layer & Client Services
- **Covered:** 0/3 files (0%)
- **Uncovered:** 3/3 files (100%)
  - ❌ `recipes.client.service.ts`
  - ❌ `profile.client.service.ts`
  - ❌ `api-client.helper.ts`

### Priority 3: Hooks & Utilities
- **Covered:** 4/4 files (100%) ✅
  - ✅ `useLocalStorage.ts`
  - ✅ `useRecipesQuery.ts`
  - ✅ `utils.ts`
  - ✅ `parse-request-body.ts`
- **Uncovered:** 0/4 files (0%)

### Priority 4: React Components
- **Covered:** 3/30+ files (~10%)
  - ✅ `PasswordInput.tsx`
  - ✅ `SignUpForm.tsx`
  - ✅ `PaginationControls.tsx`
- **Uncovered:** 27+ files (~90%)

### Priority 5: API Endpoint Edge Cases
- **Covered:** All main endpoints have tests
- **Uncovered:** Edge cases and boundary conditions

---

## Implementation Progress

### Phase 1: Critical Infrastructure ✅ 100% Complete
1. ✅ Error handling tests (`lib/errors/api-errors.test.ts`) ✅ **DONE**
2. ✅ Recipe validation tests (`lib/validation/recipe.validation.test.ts`) ✅ **DONE**
3. ✅ Recipe service tests (`lib/services/recipe.service.test.ts`) ✅ **DONE**
4. ✅ OpenRouter service tests (`lib/services/openrouter.service.test.ts`) ✅ **DONE**

### Phase 2: Service Layer ❌ 0% Complete
1. ❌ OpenRouter service tests ✅ **DONE** (moved to Phase 1)
2. ❌ Client service tests (`lib/services/client/*.test.ts`) ❌ **TODO**

### Phase 3: Hooks & Utilities ✅ 100% Complete
1. ✅ React hooks tests (`test/components/hooks/*.test.ts`) ✅ **DONE**
2. ✅ Utility function tests (`test/lib/utils.test.ts`, `test/lib/api/*.test.ts`) ✅ **DONE**

### Phase 4: Component Testing ❌ ~10% Complete
1. ❌ Critical components (forms, main views) ❌ **TODO**
2. ❌ Secondary components (cards, dialogs, displays) ❌ **TODO**

### Phase 5: Edge Cases & Enhancements ❌ 0% Complete
1. ❌ API endpoint edge cases ❌ **TODO**
2. ❌ Integration scenarios ❌ **TODO**
3. ❌ Performance testing ❌ **TODO**

---

## Testing Best Practices

### Test Structure
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should handle happy path', () => {});
    it('should handle error case', () => {});
    it('should handle edge case', () => {});
  });
});
```

### Coverage Goals
- **Statements:** 95%+ (currently 93.28%)
- **Branches:** 85%+ (currently 80.68%) ⚠️ **Priority**
- **Functions:** 95%+ (currently 95.08%)
- **Lines:** 95%+ (currently 93.38%)

### Mock Strategy
- Use `test/mocks/supabase.mock.ts` for database operations
- Mock fetch for external API calls (OpenRouter)
- Use React Testing Library for component tests
- Use Vitest for unit tests

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- api-errors.test.ts

# Watch mode
npm test -- --watch
```

---

## Next Steps

### Immediate (Priority 1)
1. ✅ Create `test/lib/errors/api-errors.test.ts` ✅ **DONE**
2. ✅ Create `test/lib/validation/recipe.validation.test.ts` ✅ **DONE**
3. ✅ Create `test/lib/services/recipe.service.test.ts` ✅ **DONE**
4. ✅ Create `test/lib/services/openrouter.service.test.ts` ✅ **DONE**

### Short-term (Priority 2-3)
1. Create client service tests
2. ✅ Create hook tests ✅ **DONE**
3. ✅ Create utility function tests ✅ **DONE**

### Medium-term (Priority 4)
1. Create component tests for forms
2. Create component tests for main views
3. Create component tests for dialogs

### Long-term (Priority 5)
1. Add edge case tests for API endpoints
2. Add integration tests
3. Add performance tests

---

## Notes

1. **Branch Coverage is Priority**: Current branch coverage (80.68%) is below target. Focus on testing all conditional paths, especially in validation and error handling.

2. **Service Layer Testing**: ✅ Recipe and OpenRouter services are now tested. Client services still need tests.

3. **Hooks & Utilities Testing**: ✅ All React hooks and utility functions are now tested. Complete coverage for `useLocalStorage`, `useRecipesQuery`, `cn()`, and `parseJsonBody()`.

4. **Component Testing**: Many components lack tests. Focus on user-facing components first (forms, main views).

4. **Mock Strategy**: Ensure mocks are comprehensive and reusable across test files.

5. **Integration Tests**: Consider adding integration tests for critical user flows (sign up → create recipe → generate variant).

---

## Estimated Effort

- **Phase 1 (Critical):** ~8-12 hours ✅ **100% Complete** ✅
- **Phase 2 (Services):** ~12-16 hours ❌ **0% Complete**
- **Phase 3 (Hooks/Utils):** ~4-6 hours ✅ **100% Complete** ✅
- **Phase 4 (Components):** ~16-24 hours ❌ **~10% Complete**
- **Phase 5 (Edge Cases):** ~8-12 hours ❌ **0% Complete**

**Total Estimated:** ~48-70 hours
**Completed:** ~12-18 hours (Phase 1 & 3 complete)
**Remaining:** ~36-52 hours

---

## Success Criteria

- [x] Error handling tests completed
- [x] Recipe validation tests completed
- [x] Recipe service tests completed
- [x] OpenRouter service tests completed
- [x] React hooks tests completed
- [x] Utility function tests completed
- [ ] Branch coverage > 85%
- [ ] Statement coverage > 95%
- [ ] All service layer functions tested
- [ ] Critical user flows have component tests
- [ ] No critical bugs found during testing
