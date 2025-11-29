import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from './db/database.types';

// ============================================================================
// Entity Types (convenience aliases from database)
// ============================================================================

/** Recipe entity from database */
export type RecipeEntity = Tables<'recipes'>;

/** Recipe variant entity from database */
export type RecipeVariantEntity = Tables<'recipe_variants'>;

/** Generation log entity from database */
export type GenerationLogEntity = Tables<'generation_logs'>;

/** User profile entity from database */
export type UserProfileEntity = Tables<'user_profiles'>;

// ============================================================================
// Common DTOs
// ============================================================================

/** Pagination metadata for list responses */
export type PaginationDTO = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

/** Standard error response format */
export type ErrorResponseDTO = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

// ============================================================================
// Recipe DTOs
// ============================================================================

/** Recipe data transfer object for list items (excludes internal fields) */
export type RecipeListItemDTO = Omit<
  RecipeEntity,
  'content_tsv' | 'deleted_at' | 'user_id'
>;

/** Recipe list response with pagination */
export type RecipeListResponseDTO = {
  data: RecipeListItemDTO[];
  pagination: PaginationDTO;
};

/** Recipe variant summary (minimal fields for nested display) */
export type RecipeVariantSummaryDTO = Pick<
  RecipeVariantEntity,
  'id' | 'created_at' | 'model'
>;

/** Full recipe DTO with nested variants for GET /api/recipes/:id */
export type RecipeDTO = Omit<RecipeEntity, 'content_tsv' | 'deleted_at'> & {
  variants: RecipeVariantSummaryDTO[];
};

/** Command to create a new recipe (excludes server-managed fields) */
export type CreateRecipeCommand = Pick<
  TablesInsert<'recipes'>,
  'title' | 'content' | 'content_json' | 'is_public'
> & {
  // Ensure at least one content field is present (validated at runtime)
  content?: string | null;
  content_json?: Json | null;
};

/** Command to update an existing recipe (all fields optional except validation) */
export type UpdateRecipeCommand = Partial<
  Pick<
    TablesUpdate<'recipes'>,
    'title' | 'content' | 'content_json' | 'is_public'
  >
> & {
  // Ensure at least one content field is present if updating content (validated at runtime)
  content?: string | null;
  content_json?: Json | null;
};

// ============================================================================
// Recipe Variant DTOs
// ============================================================================

/** Full recipe variant DTO (excludes soft-delete field) */
export type RecipeVariantDTO = Omit<RecipeVariantEntity, 'deleted_at'>;

/** Recipe variant list item DTO (same as full DTO for now) */
export type RecipeVariantListItemDTO = RecipeVariantDTO;

/** Recipe variant list response with pagination */
export type RecipeVariantListResponseDTO = {
  data: RecipeVariantListItemDTO[];
  pagination: PaginationDTO;
};

/** Command to create a new recipe variant manually */
export type CreateRecipeVariantCommand = Omit<
  TablesInsert<'recipe_variants'>,
  'recipe_id' | 'created_by' | 'created_at' | 'updated_at' | 'deleted_at' | 'id'
> & {
  // recipe_id comes from URL parameter
  // Ensure at least one output field is present (validated at runtime)
  output_text?: string | null;
  output_json?: Json | null;
};

/** Command to generate a new recipe variant using AI */
export type GenerateRecipeVariantCommand = {
  parent_variant_id?: string | null;
  model?: string | null;
  custom_prompt?: string | null;
  use_profile_preferences: boolean;
  // recipe_id comes from URL parameter
};

/** Generated recipe variant response (includes all fields after AI generation) */
export type GeneratedRecipeVariantDTO = RecipeVariantDTO & {
  // All fields are guaranteed to be present after successful generation
  model: string;
  prompt: string;
  preferences_snapshot: Json;
};

// ============================================================================
// Generation Log DTOs
// ============================================================================

/** Generation log DTO (matches database entity exactly) */
export type GenerationLogDTO = GenerationLogEntity;

/** Generation log list response with pagination */
export type GenerationLogListResponseDTO = {
  data: GenerationLogDTO[];
  pagination: PaginationDTO;
};

/** Weekly generation count for statistics */
export type WeeklyGenerationCountDTO = {
  week: string; // Format: "YYYY-W##"
  count: number;
};

/** Generation statistics response */
export type GenerationStatsDTO = {
  total_generations: number;
  total_edits: number;
  total_deletes: number;
  period: 'week' | 'month' | 'year' | 'all';
  generations_by_week: WeeklyGenerationCountDTO[];
};

// ============================================================================
// User Profile DTOs
// ============================================================================

/** Command to update user profile (excludes server-managed fields) */
export type UpdateUserProfileCommand = Omit<
  TablesInsert<'user_profiles'>,
  'user_id' | 'created_at' | 'updated_at'
>;

/** Valid diet enum values from database constraints */
export type DietType =
  | 'none'
  | 'vegan'
  | 'vegetarian'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'halal'
  | 'kosher';

// ============================================================================
// Action Types (for generation logs)
// ============================================================================

/** Valid action types for generation logs */
export type GenerationLogAction = 'generate' | 'edit' | 'delete';

// ============================================================================
// Query Parameter Types (for API endpoints)
// ============================================================================

/** Query parameters for recipe list endpoint */
export type RecipeListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'title';
  order?: 'asc' | 'desc';
};

/** Query parameters for recipe variant list endpoint */
export type RecipeVariantListQueryParams = {
  page?: number;
  limit?: number;
  sort?: 'created_at';
  order?: 'asc' | 'desc';
};

/** Query parameters for generation log list endpoint */
export type GenerationLogListQueryParams = {
  page?: number;
  limit?: number;
  action?: GenerationLogAction;
  recipe_id?: string;
  variant_id?: string;
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  sort?: 'created_at';
  order?: 'asc' | 'desc';
};

/** Query parameters for generation statistics endpoint */
export type GenerationStatsQueryParams = {
  period?: 'week' | 'month' | 'year' | 'all';
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
};

// ============================================================================
// OpenRouter Service Types
// ============================================================================

/** Chat message role types */
export type ChatMessageRole = 'system' | 'user' | 'assistant';

/** Single chat message */
export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

/** JSON Schema type definition (simplified) */
export type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
  enum?: unknown[];
  // Add other JSON Schema properties as needed
};

/** Response format for JSON schema */
export type JsonSchemaResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
};

/** Chat completion request parameters */
export type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  response_format?: JsonSchemaResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
};

/** Choice in chat completion response */
export type ChatCompletionChoice = {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
};

/** Usage statistics */
export type UsageStats = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

/** Chat completion response from OpenRouter */
export type ChatCompletionResponse = {
  id: string;
  model: string;
  choices: ChatCompletionChoice[];
  usage: UsageStats;
  created: number;
};

/** Model information */
export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
};

/** Model list response */
export type ModelListResponse = {
  data: ModelInfo[];
};

/** Internal request payload format for OpenRouter API */
export type OpenRouterRequestPayload = {
  model: string;
  messages: ChatMessage[];
  response_format?: JsonSchemaResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
};
