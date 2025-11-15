# REST API Plan

## 1. Resources

- **User Profiles** - Corresponds to `public.user_profiles` table
- **Recipes** - Corresponds to `public.recipes` table
- **Recipe Variants** - Corresponds to `public.recipe_variants` table
- **Generation Logs** - Corresponds to `public.generation_logs` table

## 2. Endpoints

### 2.2 Recipes

#### GET /api/recipes

List recipes for the authenticated user with pagination, filtering, and search

**Query Parameters:**

- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20, max: 100) - Number of items per page
- `search` (optional) - Full-text search query
- `sort` (optional, default: "created_at") - Sort field: `created_at`, `updated_at`, `title`
- `order` (optional, default: "desc") - Sort order: `asc`, `desc`

**Request Payload:** None

**Response Payload:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
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

**Success Codes:**

- `200 OK` - Recipes retrieved successfully

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid query parameters

---

#### GET /api/recipes/:id

Get a single recipe by ID

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string | null",
  "content_json": {} | null,
  "is_public": false,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "variants": [
    {
      "id": "uuid",
      "created_at": "ISO 8601 timestamp",
      "model": "string | null"
    }
  ]
}
```

**Success Codes:**

- `200 OK` - Recipe found and returned

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have access to this recipe
- `404 Not Found` - Recipe does not exist or is soft-deleted

---

#### POST /api/recipes

Create a new recipe

**Query Parameters:** None

**Request Payload:**

```json
{
  "title": "string",
  "content": "string | null",
  "content_json": {} | null,
  "is_public": false
}
```

**Validation:**

- `title` is required and must be a non-empty string
- At least one of `content` or `content_json` must be present
- `is_public` defaults to `false` if not provided

**Response Payload:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string | null",
  "content_json": {} | null,
  "is_public": false,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**

- `201 Created` - Recipe created successfully

**Error Codes:**

- `400 Bad Request` - Invalid request payload or validation failure
- `401 Unauthorized` - User not authenticated

---

#### PUT /api/recipes/:id

Update an existing recipe

**Query Parameters:** None

**Request Payload:**

```json
{
  "title": "string",
  "content": "string | null",
  "content_json": {} | null,
  "is_public": false
}
```

**Validation:**

- `title` must be a non-empty string if provided
- At least one of `content` or `content_json` must be present if updating content fields
- User must own the recipe

**Response Payload:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string | null",
  "content_json": {} | null,
  "is_public": false,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**

- `200 OK` - Recipe updated successfully

**Error Codes:**

- `400 Bad Request` - Invalid request payload or validation failure
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not own this recipe
- `404 Not Found` - Recipe does not exist or is soft-deleted

---

#### DELETE /api/recipes/:id

Soft delete a recipe

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**

```json
{
  "message": "Recipe deleted successfully"
}
```

**Success Codes:**

- `200 OK` - Recipe soft-deleted successfully

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not own this recipe
- `404 Not Found` - Recipe does not exist or is already deleted

---

### 2.3 Recipe Variants

#### GET /api/recipes/:recipeId/variants

List all variants for a recipe

**Query Parameters:**

- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20, max: 100) - Number of items per page
- `sort` (optional, default: "created_at") - Sort field: `created_at`
- `order` (optional, default: "desc") - Sort order: `asc`, `desc`

**Request Payload:** None

**Response Payload:**

```json
{
  "data": [
    {
      "id": "uuid",
      "recipe_id": "uuid",
      "parent_variant_id": "uuid | null",
      "created_by": "uuid | null",
      "model": "string | null",
      "prompt": "string | null",
      "preferences_snapshot": {} | null,
      "output_text": "string | null",
      "output_json": {} | null,
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "total_pages": 1
  }
}
```

**Success Codes:**

- `200 OK` - Variants retrieved successfully

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have access to the parent recipe
- `404 Not Found` - Recipe does not exist or is soft-deleted
- `400 Bad Request` - Invalid query parameters

---

#### GET /api/recipes/:recipeId/variants/:variantId

Get a single recipe variant by ID

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**

```json
{
  "id": "uuid",
  "recipe_id": "uuid",
  "parent_variant_id": "uuid | null",
  "created_by": "uuid | null",
  "model": "string | null",
  "prompt": "string | null",
  "preferences_snapshot": {} | null,
  "output_text": "string | null",
  "output_json": {} | null,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**

- `200 OK` - Variant found and returned

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have access to this variant
- `404 Not Found` - Variant or recipe does not exist or is soft-deleted

---

#### POST /api/recipes/:recipeId/variants

Create a new recipe variant (AI-generated or manual)

**Query Parameters:** None

**Request Payload:**

```json
{
  "parent_variant_id": "uuid | null",
  "model": "string | null",
  "prompt": "string | null",
  "preferences_snapshot": {} | null,
  "output_text": "string | null",
  "output_json": {} | null
}
```

**Validation:**

- At least one of `output_text` or `output_json` must be present
- `recipe_id` is taken from the URL parameter
- `parent_variant_id` must reference an existing variant of the same recipe if provided
- User must own the parent recipe

**Response Payload:**

```json
{
  "id": "uuid",
  "recipe_id": "uuid",
  "parent_variant_id": "uuid | null",
  "created_by": "uuid",
  "model": "string | null",
  "prompt": "string | null",
  "preferences_snapshot": {} | null,
  "output_text": "string | null",
  "output_json": {} | null,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**

- `201 Created` - Variant created successfully

**Error Codes:**

- `400 Bad Request` - Invalid request payload or validation failure
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not own the parent recipe
- `404 Not Found` - Recipe or parent variant does not exist

---

#### POST /api/recipes/:recipeId/variants/generate

Generate a new recipe variant using AI based on user preferences

**Query Parameters:** None

**Request Payload:**

```json
{
  "parent_variant_id": "uuid | null",
  "model": "string | null",
  "custom_prompt": "string | null",
  "use_profile_preferences": true
}
```

**Validation:**

- `recipe_id` is taken from the URL parameter
- `parent_variant_id` must reference an existing variant of the same recipe if provided
- If `use_profile_preferences` is `true`, user profile must exist
- User must own the parent recipe

**Response Payload:**

```json
{
  "id": "uuid",
  "recipe_id": "uuid",
  "parent_variant_id": "uuid | null",
  "created_by": "uuid",
  "model": "string",
  "prompt": "string",
  "preferences_snapshot": {},
  "output_text": "string | null",
  "output_json": {} | null,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Business Logic:**

- If `use_profile_preferences` is `true`, fetch user profile and include dietary preferences, allergens, disliked ingredients, and calorie target in the AI prompt
- If `parent_variant_id` is provided, use that variant's output as the base recipe; otherwise, use the original recipe
- Call OpenRouter.ai API to generate modified recipe
- Store the generated variant with all metadata
- Log the generation action in `generation_logs`

**Success Codes:**

- `201 Created` - Variant generated and created successfully

**Error Codes:**

- `400 Bad Request` - Invalid request payload, validation failure, or missing user profile when required
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not own the parent recipe
- `404 Not Found` - Recipe or parent variant does not exist
- `500 Internal Server Error` - AI generation failed

---

#### DELETE /api/recipes/:recipeId/variants/:variantId

Soft delete a recipe variant

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**

```json
{
  "message": "Variant deleted successfully"
}
```

**Success Codes:**

- `200 OK` - Variant soft-deleted successfully

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not own the parent recipe
- `404 Not Found` - Variant does not exist or is already deleted

---

### 2.4 Generation Logs

#### GET /api/logs

Get generation logs for the authenticated user

**Query Parameters:**

- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20, max: 100) - Number of items per page
- `action` (optional) - Filter by action: `generate`, `edit`, `delete`
- `recipe_id` (optional) - Filter by recipe ID
- `variant_id` (optional) - Filter by variant ID
- `start_date` (optional) - Filter logs from this date (ISO 8601)
- `end_date` (optional) - Filter logs until this date (ISO 8601)
- `sort` (optional, default: "created_at") - Sort field: `created_at`
- `order` (optional, default: "desc") - Sort order: `asc`, `desc`

**Request Payload:** None

**Response Payload:**

```json
{
  "data": [
    {
      "id": "number",
      "user_id": "uuid",
      "recipe_id": "uuid | null",
      "variant_id": "uuid | null",
      "action": "generate | edit | delete",
      "metadata": {},
      "created_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

**Success Codes:**

- `200 OK` - Logs retrieved successfully

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid query parameters

---

#### GET /api/logs/stats

Get generation statistics for the authenticated user

**Query Parameters:**

- `period` (optional, default: "week") - Time period: `week`, `month`, `year`, `all`
- `start_date` (optional) - Custom start date (ISO 8601)
- `end_date` (optional) - Custom end date (ISO 8601)

**Request Payload:** None

**Response Payload:**

```json
{
  "total_generations": 10,
  "total_edits": 5,
  "total_deletes": 2,
  "period": "week",
  "generations_by_week": [
    {
      "week": "2024-W01",
      "count": 3
    }
  ]
}
```

**Business Logic:**

- Calculate total counts of each action type for the specified period
- Group generations by week for weekly activity tracking (supports success KPI: 75% users generate 1+ recipes per week)

**Success Codes:**

- `200 OK` - Statistics retrieved successfully

**Error Codes:**

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid query parameters

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Implementation:** Supabase Auth (JWT-based)

- All API endpoints (except optional public recipe read) require authentication
- Authentication is handled via Supabase client SDK in middleware
- JWT token is extracted from the `Authorization` header: `Bearer <token>`
- Token is validated using Supabase's built-in validation
- Authenticated user ID is available via `auth.uid()` in database queries

**Middleware Flow:**

1. Extract JWT token from `Authorization` header
2. Validate token using Supabase client
3. Set authenticated user context in `App.Locals`
4. Continue to endpoint handler if valid; return `401 Unauthorized` if invalid

### 3.2 Authorization Rules

**Row-Level Security (RLS):**

- All tables have RLS enabled in PostgreSQL
- Policies are enforced at the database level
- API endpoints rely on RLS policies for authorization

**Access Rules:**

- **User Profiles:** Users can only access their own profile
- **Recipes:**
  - Users have full access (CRUD) to their own recipes
  - Recipes can be marked as `is_public = true` for read-only public access (outside MVP scope but supported by schema)
  - Soft-deleted recipes are excluded from all queries
- **Recipe Variants:**
  - Users have full access to variants of recipes they own
  - Variants are publicly readable if the parent recipe is public (outside MVP scope)
  - Soft-deleted variants are excluded from all queries
- **Generation Logs:**
  - Users can only read their own logs
  - Users can only create logs for themselves

**Authorization Enforcement:**

- Database RLS policies automatically enforce access rules
- API endpoints validate ownership before modifications (additional safety layer)
- Foreign key constraints ensure referential integrity

## 4. Validation and Business Logic

### 4.1 Validation Conditions

#### User Profiles

**Database Constraints:**

- `diet` must be one of: `none`, `vegan`, `vegetarian`, `pescatarian`, `keto`, `paleo`, `halal`, `kosher`
- `calorie_target` must be a positive integer if provided (`check (calorie_target > 0)`)
- `allergens` and `disliked_ingredients` must be arrays (PostgreSQL `text[]`)
- `extra` must be a valid JSONB object (default: `{}`)

**API Validation:**

- Validate `diet` enum value in request payload
- Validate `calorie_target` is positive integer if provided
- Validate arrays are arrays of strings
- Validate JSONB structure if `extra` is provided

#### Recipes

**Database Constraints:**

- `title` is required (`not null`)
- `user_id` is required (`not null`) and references `auth.users(id)`
- At least one of `content` or `content_json` must be present (`constraint recipes_content_presence`)
- `is_public` defaults to `false`
- Soft-deleted recipes have `deleted_at` set to a timestamp

**API Validation:**

- `title` must be a non-empty string
- At least one of `content` or `content_json` must be provided
- `content_json` must be valid JSON if provided
- Validate UUID format for `id` in URL parameters

#### Recipe Variants

**Database Constraints:**

- `recipe_id` is required and references `public.recipes(id)`
- `parent_variant_id` optionally references `public.recipe_variants(id)`
- At least one of `output_text` or `output_json` must be present (`constraint recipe_variants_output_presence`)
- Soft-deleted variants have `deleted_at` set to a timestamp

**API Validation:**

- `recipe_id` must reference an existing recipe owned by the user
- `parent_variant_id` must reference an existing variant of the same recipe if provided
- At least one of `output_text` or `output_json` must be provided
- `output_json` must be valid JSON if provided
- `preferences_snapshot` must be valid JSONB if provided

#### Generation Logs

**Database Constraints:**

- `user_id` is required and references `auth.users(id)`
- `action` must be one of: `generate`, `edit`, `delete`
- `metadata` must be valid JSONB (default: `{}`)

**API Validation:**

- `action` must be one of the allowed enum values
- `metadata` must be valid JSON if provided
- `recipe_id` and `variant_id` must be valid UUIDs if provided

### 4.2 Business Logic Implementation

#### Recipe Creation and Management

**Save Recipe:** `POST /api/recipes`

- User provides recipe title and content (text or JSON)
- System automatically assigns `user_id` from authenticated user
- System sets `created_at` and `updated_at` timestamps
- Returns created recipe with generated UUID

**Read Recipe:** `GET /api/recipes/:id`

- Verifies user ownership or public access via RLS
- Excludes soft-deleted recipes
- Optionally includes related variants in response

**Browse Recipes:** `GET /api/recipes`

- Lists recipes owned by authenticated user
- Supports full-text search using PostgreSQL `tsvector` index
- Implements pagination with configurable page size
- Supports sorting by `created_at`, `updated_at`, or `title`
- Excludes soft-deleted recipes automatically

**Delete Recipe:** `DELETE /api/recipes/:id`

- Performs soft delete by setting `deleted_at` timestamp
- Cascades to related variants (database foreign key constraint)
- Logs delete action in `generation_logs`

#### Dietary Preferences Management

**Save Preferences:** `PUT /api/profile`

- Creates or updates user profile
- Validates diet enum, allergens array, disliked ingredients array
- Validates calorie target is positive integer
- Sets `updated_at` timestamp automatically via database trigger
- Supports success KPI: 90% users have filled profile preferences

#### AI Recipe Modification

**Generate Variant:** `POST /api/recipes/:recipeId/variants/generate`

- Fetches user profile if `use_profile_preferences` is true
- Builds AI prompt including:
  - Original recipe content (from recipe or parent variant)
  - User's dietary preferences (diet type, allergens, disliked ingredients)
  - Calorie target if specified
  - Custom prompt if provided
- Calls OpenRouter.ai API with selected model
- Stores generated variant with metadata:
  - Model used
  - Prompt sent
  - Preferences snapshot (for audit trail)
  - Generated output (text or JSON)
- Creates log entry in `generation_logs` with action `generate`
- Returns generated variant

**Validation:**

- Ensures user profile exists if preferences are requested
- Validates recipe ownership
- Validates parent variant belongs to the same recipe if provided
- Handles AI API failures gracefully with error response

#### Activity Tracking and Metrics

**Generation Logs:** `POST /api/recipes/:recipeId/variants` and `POST /api/recipes/:recipeId/variants/generate`

- Automatically creates log entries for all recipe modifications
- Tracks action type (`generate`, `edit`, `delete`)
- Stores metadata including model, timestamp, and related IDs

**Statistics:** `GET /api/logs/stats`

- Calculates generation counts per user per week
- Supports success KPI: 75% users generate 1+ recipes per week
- Groups data by week, month, or year
- Uses indexed queries for performance

#### Pagination

**Standard Pagination:**

- All list endpoints support pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Returns pagination metadata:
  - Current page
  - Items per page
  - Total items
  - Total pages

**Implementation:**

- Uses SQL `LIMIT` and `OFFSET` for pagination
- Calculates totals using `COUNT(*)` (consider caching for large datasets)

#### Filtering and Search

**Full-Text Search:** `GET /api/recipes`

- Uses PostgreSQL `tsvector` index on `recipes.content_tsv`
- Searches both title (weight A) and content (weight B)
- Returns results ranked by relevance

**Filtering:**

- Generation logs support filtering by action, recipe_id, variant_id, and date range
- Uses indexed queries for performance

**Sorting:**

- All list endpoints support sorting
- Default sort: `created_at DESC`
- Supports sorting by relevant fields per resource

### 4.3 Error Handling

**Standard Error Response Format:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Error Codes:**

- `400 Bad Request` - Invalid input, validation failure
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - User lacks permission for the requested resource
- `404 Not Found` - Resource does not exist or is soft-deleted
- `500 Internal Server Error` - Server error, AI generation failure

**Validation Errors:**

- Return `400 Bad Request` with detailed field-level validation errors
- Use clear, user-friendly error messages

### 4.4 Performance Considerations

**Indexing:**

- Database indexes support efficient queries:
  - User-owned recipe listing (`idx_recipes_user_created_at`)
  - Full-text search (`idx_recipes_content_tsv`)
  - Recipe variants by recipe (`idx_recipe_variants_recipe_created_at`)
  - Generation logs by user and date (`idx_generation_logs_user_created_at`)

**Query Optimization:**

- Use indexed columns in WHERE clauses
- Limit result sets with pagination
- Use soft-delete filtering (`deleted_at IS NULL`) efficiently
- Consider JSONB GIN indexes for filtering on JSONB fields in future

**Caching Considerations:**

- Profile data could be cached per user session
- Recipe listings could benefit from caching with TTL
- Statistics queries could be cached or materialized for heavy use

---

## 5. Additional Notes

### Assumptions

1. **Supabase Auth:** User authentication is handled entirely by Supabase Auth system. API endpoints receive authenticated user context via middleware.

2. **OpenRouter.ai Integration:** The AI generation endpoint integrates with OpenRouter.ai API. The exact model selection and prompt formatting details are implementation-specific but should support multiple AI providers.

3. **Rate Limiting:** Rate limiting is not explicitly defined in the PRD but should be considered for:
   - AI generation endpoints (to control costs)
   - General API usage (to prevent abuse)

4. **Public Recipe Access:** While the schema supports `is_public` recipes, the PRD explicitly excludes sharing features from MVP. Public read endpoints are documented but may not be implemented in MVP.

5. **Soft Deletes:** All delete operations perform soft deletes. Hard deletes (permanent removal) are not included in the MVP API.

### Future Considerations

- Batch operations (create multiple recipes at once)
- Recipe import from URLs (excluded from MVP)
- Media attachments (excluded from MVP)
- Recipe sharing and collaboration features (excluded from MVP)
- Advanced search with ingredient filtering
- Recipe version history and comparison
- Export functionality (PDF, markdown, etc.)
