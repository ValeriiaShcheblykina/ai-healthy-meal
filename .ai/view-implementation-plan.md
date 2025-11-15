# API Endpoint Implementation Plan: GET /api/recipes

## 1. Endpoint Overview

The `GET /api/recipes` endpoint retrieves a paginated list of recipes owned by the authenticated user. It supports:
- Pagination with configurable page size
- Full-text search across recipe titles and content
- Sorting by `created_at`, `updated_at`, or `title` in ascending or descending order
- Automatic filtering to exclude soft-deleted recipes

This endpoint is a read-only operation that leverages PostgreSQL's full-text search capabilities using the `content_tsv` generated column and GIN index for efficient querying. Authentication is required, and Row-Level Security (RLS) policies automatically enforce that users can only see their own recipes.

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/recipes`
- **Query Parameters:**
  - **Optional:**
    - `page` (number, default: 1) - Page number for pagination (must be >= 1)
    - `limit` (number, default: 20, max: 100) - Number of items per page
    - `search` (string) - Full-text search query for recipe titles and content
    - `sort` (string, default: "created_at") - Sort field: `created_at`, `updated_at`, or `title`
    - `order` (string, default: "desc") - Sort order: `asc` or `desc`
- **Request Body:** None
- **Authentication:** Required (JWT token via `Authorization` header)

## 3. Used Types

### Request Types
- `RecipeListQueryParams` - Query parameter validation (from `src/types.ts`)

### Response Types
- `RecipeListResponseDTO` - Response structure with data and pagination (from `src/types.ts`)
- `RecipeListItemDTO` - Individual recipe item in the list (from `src/types.ts`)
- `PaginationDTO` - Pagination metadata (from `src/types.ts`)
- `ErrorResponseDTO` - Standard error response format (from `src/types.ts`)

### Database Types
- `RecipeEntity` - Full recipe entity from database (from `src/types.ts`)
- `Tables<'recipes'>` - Database table type (from `src/db/database.types.ts`)

## 4. Response Details

### Success Response (200 OK)

**Structure:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string | null",
      "content_json": {} | null,
      "is_public": false,
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**Notes:**
- Response excludes internal fields: `content_tsv`, `deleted_at`, `user_id`
- All timestamps are in ISO 8601 format
- Empty result set returns `data: []` with `total: 0`

### Error Responses

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "page": "must be a positive integer",
      "limit": "must be between 1 and 100"
    }
  }
}
```

## 5. Data Flow

1. **Middleware Authentication:**
   - Request passes through Astro middleware (`src/middleware/index.ts`)
   - Supabase client is available via `context.locals.supabase`
   - JWT token validation is handled by Supabase (via middleware or in endpoint)
   - Authenticated user ID is available via `auth.uid()` in database queries

2. **Query Parameter Parsing:**
   - Extract and validate query parameters from URL
   - Apply defaults: `page = 1`, `limit = 20`, `sort = "created_at"`, `order = "desc"`
   - Validate numeric ranges and enum values

3. **Service Layer (Recipe Service):**
   - Call `RecipeService.listRecipes()` with validated parameters
   - Service handles database query construction and execution

4. **Database Query:**
   - Build Supabase query with:
     - Filter: `deleted_at IS NULL` (soft-delete exclusion)
     - Filter: RLS automatically filters by `user_id = auth.uid()`
     - Optional: Full-text search using `content_tsv @@ plainto_tsquery('simple', search)`
     - Ordering: Sort by specified field and order
     - Pagination: Apply `LIMIT` and `OFFSET`
   - Execute count query for total items (excluding soft-deleted via RLS)

5. **Response Transformation:**
   - Map database entities to `RecipeListItemDTO` (exclude internal fields)
   - Calculate pagination metadata (total pages)
   - Return structured response

## 6. Security Considerations

### Authentication
- **Mechanism:** JWT-based authentication via Supabase Auth
- **Validation:** Token must be present in `Authorization: Bearer <token>` header
- **Failure Handling:** Return `401 Unauthorized` if token is missing or invalid

### Authorization
- **Database-Level Enforcement:** RLS policies automatically restrict access to user's own recipes
- **Policy Applied:** `recipes_owner_all` policy ensures `user_id = auth.uid()` and `deleted_at IS NULL`
- **Additional Safety:** API endpoint relies on RLS; no additional authorization checks needed for list operations

### Input Validation
- **SQL Injection Prevention:** Use Supabase query builder (parameterized queries)
- **Query Parameter Validation:**
  - `page`: Must be positive integer >= 1
  - `limit`: Must be integer between 1 and 100 (enforce max to prevent resource exhaustion)
  - `sort`: Must be one of: `created_at`, `updated_at`, `title` (whitelist approach)
  - `order`: Must be `asc` or `desc` (whitelist approach)
  - `search`: Sanitize to prevent injection (Supabase handles this, but validate it's a string)

### Data Exposure
- **Internal Fields:** Exclude `content_tsv`, `deleted_at`, `user_id` from response
- **Soft-Deleted Records:** Automatically excluded via RLS policies and query filters

### Rate Limiting
- Consider implementing rate limiting for this endpoint (not specified in MVP but recommended)
- Potential abuse: Large `limit` values, excessive pagination requests

## 7. Error Handling

### Error Scenarios and Status Codes

1. **401 Unauthorized:**
   - **Scenario:** Missing or invalid JWT token
   - **Detection:** Supabase auth validation fails
   - **Response:** Return `401` with `UNAUTHORIZED` error code
   - **Logging:** Log authentication failure (no user data)

2. **400 Bad Request:**
   - **Scenario:** Invalid query parameters
     - `page` is not a positive integer
     - `limit` is not an integer or outside 1-100 range
     - `sort` is not one of allowed values
     - `order` is not `asc` or `desc`
   - **Detection:** Parameter validation in endpoint handler
   - **Response:** Return `400` with `VALIDATION_ERROR` code and detailed field errors
   - **Logging:** Log validation failures for debugging

3. **500 Internal Server Error:**
   - **Scenario:** Database connection failure, query execution error, or unexpected exception
   - **Detection:** Try-catch in service layer or endpoint handler
   - **Response:** Return `500` with `INTERNAL_ERROR` code and generic message (avoid exposing internals)
   - **Logging:** Log full error details server-side for debugging

### Error Response Format

All errors follow the standard `ErrorResponseDTO` format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific validation error"
    }
  }
}
```

### Error Logging Strategy
- Log all errors with appropriate severity levels
- Include request context (user ID, query parameters) but sanitize sensitive data
- Use structured logging for easier debugging
- Consider logging to external service (e.g., Sentry) for production

## 8. Performance Considerations

### Database Optimization

1. **Index Usage:**
   - Primary index: `idx_recipes_user_created_at` on `(user_id, created_at desc) WHERE deleted_at IS NULL`
   - Full-text search index: `idx_recipes_content_tsv` using GIN on `content_tsv WHERE deleted_at IS NULL`
   - These indexes are automatically used by PostgreSQL query planner

2. **Query Efficiency:**
   - Use `LIMIT` and `OFFSET` for pagination (consider cursor-based pagination for very large datasets in future)
   - Count query should use same filters as data query for accuracy
   - Soft-delete filtering (`deleted_at IS NULL`) is part of index condition

3. **Full-Text Search:**
   - Use `plainto_tsquery('simple', search)` for user-friendly search (handles multiple words)
   - Use `@@` operator with `content_tsv` for indexed search
   - Consider search result ranking in future iterations

### Potential Bottlenecks

1. **Count Query:**
   - `COUNT(*)` can be slow on large tables
   - Current approach: Execute separate count query (acceptable for MVP)
   - Future optimization: Consider caching counts, materialized views, or approximate counts

2. **Large Limit Values:**
   - Enforcing max `limit: 100` prevents excessive data transfer
   - Consider warning or rate limiting for users requesting large pages repeatedly

3. **Full-Text Search:**
   - Complex search queries may be slow without proper indexes (already addressed with GIN index)
   - Very long search strings should be truncated (e.g., max 200 characters)

### Caching Strategy

- **Profile Data:** User profile could be cached per session (not applicable to this endpoint)
- **Recipe Lists:** Consider caching with TTL for frequently accessed lists (not in MVP scope)
- **Search Results:** Could benefit from caching, but cache invalidation complexity may outweigh benefits

### Monitoring Metrics

- Track query execution time (target: < 200ms for typical queries)
- Monitor pagination patterns (average page size, most common sort options)
- Track search query patterns for future optimization
- Monitor error rates (target: < 1% error rate)

## 9. Implementation Steps

1. **Create Recipe Service (`src/lib/services/recipe.service.ts`):**
   - Implement `listRecipes()` method
   - Accept `RecipeListQueryParams` as input
   - Build Supabase query with filters, search, sorting, and pagination
   - Execute data query and count query
   - Transform results to `RecipeListItemDTO[]`
   - Calculate pagination metadata
   - Return `RecipeListResponseDTO`
   - Handle database errors and throw appropriate exceptions

2. **Create Validation Utilities (`src/lib/validation/recipe.validation.ts`):**
   - Implement `validateRecipeListQueryParams()` function
   - Validate `page` (positive integer >= 1)
   - Validate `limit` (integer, 1-100 range)
   - Validate `sort` (whitelist: `created_at`, `updated_at`, `title`)
   - Validate `order` (whitelist: `asc`, `desc`)
   - Validate `search` (string, optional, max length)
   - Return validation errors in structured format

3. **Create Error Utilities (`src/lib/errors/api-errors.ts`):**
   - Define error classes or factories for API errors
   - Implement `createErrorResponse()` helper for consistent error formatting
   - Define error codes: `UNAUTHORIZED`, `VALIDATION_ERROR`, `INTERNAL_ERROR`

4. **Create Endpoint Handler (`src/pages/api/recipes/index.ts`):**
   - Export `GET` handler function
   - Set `export const prerender = false` for dynamic API route
   - Extract query parameters from `Astro.url.searchParams`
   - Validate authentication (check Supabase client and user session)
   - Call validation function for query parameters
   - Call `RecipeService.listRecipes()` with validated parameters and Supabase client
   - Handle errors and return appropriate status codes
   - Return `RecipeListResponseDTO` with status `200`

5. **Create Authentication Helper (`src/lib/auth/get-authenticated-user.ts`):**
   - Extract user ID from Supabase session
   - Validate session exists
   - Return user ID or throw authentication error
   - This can be reused across all authenticated endpoints

6. **Add Zod Schema Validation (Optional but Recommended):**
   - Create Zod schema for `RecipeListQueryParams` in `src/lib/validation/schemas.ts`
   - Use Zod for runtime validation and type inference
   - Provide better error messages and type safety

7. **Write Unit Tests:**
   - Test validation function with various invalid inputs
   - Test service method with mock Supabase client
   - Test endpoint handler with mock request/response
   - Test error handling scenarios

8. **Integration Testing:**
   - Test with real database (test environment)
   - Test pagination edge cases (page 1, last page, empty results)
   - Test full-text search with various queries
   - Test sorting with different fields and orders
   - Test authentication and authorization (401, 403 scenarios)

9. **Documentation:**
   - Add JSDoc comments to service methods
   - Document query parameter constraints
   - Update API documentation with example requests/responses

10. **Error Logging Integration:**
    - Set up structured logging (e.g., using console with context or external service)
    - Log all errors with request context
    - Ensure sensitive data is not logged

### File Structure

```
src/
  pages/
    api/
      recipes/
        index.ts                    # GET /api/recipes endpoint handler
  lib/
    services/
      recipe.service.ts             # Recipe business logic
    validation/
      recipe.validation.ts          # Query parameter validation
      schemas.ts                    # Zod schemas (optional)
    errors/
      api-errors.ts                 # Error utilities
    auth/
      get-authenticated-user.ts     # Authentication helper
```

### Dependencies

- `@supabase/supabase-js` - Already available in project
- `zod` - Recommended for validation (may need to be added to package.json)

### Notes

- Use Supabase client from `context.locals.supabase` (per implementation rules)
- RLS policies handle authorization automatically, but validate user session exists
- Soft-deleted recipes are automatically excluded via RLS and query filters
- Full-text search uses PostgreSQL's `tsvector` with simple tokenizer for MVP (can be enhanced later)
- Consider implementing cursor-based pagination for very large datasets in future iterations

