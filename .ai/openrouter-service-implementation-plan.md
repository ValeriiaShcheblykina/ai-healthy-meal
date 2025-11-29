# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter Service is a TypeScript service class that provides a clean abstraction layer for interacting with the OpenRouter API to complete LLM-based chat conversations. The service handles request construction, response parsing, error handling, and ensures compliance with OpenRouter's API specifications.

**Key Responsibilities:**

- Constructing properly formatted API requests to OpenRouter
- Managing authentication via API key
- Handling system messages, user messages, and conversation history
- Supporting structured JSON schema responses via `response_format`
- Configuring model selection and parameters (temperature, max_tokens, etc.)
- Processing and validating API responses
- Implementing robust error handling and retry logic
- Logging requests and responses for debugging and monitoring

**Location:** `src/lib/services/openrouter.service.ts`

## 2. Constructor Description

The constructor initializes the service with required configuration, including the OpenRouter API key and optional base URL. It validates that the API key is provided and sets up default headers for all requests.

```typescript
/**
 * Creates a new OpenRouterService instance.
 *
 * @constructor
 * @param {string} apiKey - OpenRouter API key from environment variables (OPENROUTER_API_KEY)
 * @param {string} [baseUrl='https://openrouter.ai/api/v1'] - Optional base URL for OpenRouter API
 *
 * @throws {Error} If apiKey is not provided or is empty
 *
 * @example
 * const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
 */
constructor(apiKey: string, baseUrl: string = 'https://openrouter.ai/api/v1')
```

**Constructor Implementation Details:**

1. Validate that `apiKey` is provided and non-empty
2. Store `apiKey` as a private readonly field
3. Store `baseUrl` as a private readonly field with default value
4. Initialize default headers with Authorization Bearer token
5. Set up default model parameters (can be overridden per request)

## 3. Public Methods and Fields

### 3.1 `chatCompletion`

Main method for sending chat completion requests to OpenRouter API.

```typescript
/**
 * Sends a chat completion request to OpenRouter API.
 *
 * @async
 * @method chatCompletion
 * @param {ChatCompletionRequest} request - Request parameters
 * @param {string} request.model - Model identifier (e.g., 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet')
 * @param {ChatMessage[]} request.messages - Array of conversation messages
 * @param {JsonSchemaResponseFormat} [request.response_format] - Optional JSON schema for structured responses
 * @param {number} [request.temperature] - Sampling temperature (0-2, default: 1)
 * @param {number} [request.max_tokens] - Maximum tokens in response (default: model-specific)
 * @param {number} [request.top_p] - Nucleus sampling parameter (0-1, default: 1)
 * @param {number} [request.frequency_penalty] - Frequency penalty (-2 to 2, default: 0)
 * @param {number} [request.presence_penalty] - Presence penalty (-2 to 2, default: 0)
 * @param {string[]} [request.stop] - Stop sequences to end generation
 * @param {boolean} [request.stream] - Enable streaming responses (default: false)
 *
 * @returns {Promise<ChatCompletionResponse>} API response with choices and metadata
 *
 * @throws {ApiError} If request validation fails or API returns an error
 *
 * @example
 * const response = await service.chatCompletion({
 *   model: 'openai/gpt-4o',
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant.' },
 *     { role: 'user', content: 'What is the weather in London?' }
 *   ],
 *   temperature: 0.7,
 *   max_tokens: 500
 * });
 */
async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>
```

### 3.2 `chatCompletionWithSchema`

Convenience method for structured JSON responses using JSON schema.

```typescript
/**
 * Sends a chat completion request with JSON schema response format.
 *
 * @async
 * @method chatCompletionWithSchema
 * @param {ChatCompletionRequest} request - Request parameters (response_format will be overridden)
 * @param {JsonSchema} schema - JSON schema object defining the expected response structure
 * @param {string} schemaName - Name identifier for the schema (e.g., 'recipe_response', 'weather_data')
 * @param {boolean} [strict=true] - Whether to enforce strict schema compliance
 *
 * @returns {Promise<ChatCompletionResponse>} API response with JSON-parsed content
 *
 * @example
 * const response = await service.chatCompletionWithSchema(
 *   {
 *     model: 'openai/gpt-4o',
 *     messages: [{ role: 'user', content: 'Generate a recipe for pasta' }]
 *   },
 *   {
 *     type: 'object',
 *     properties: {
 *       title: { type: 'string' },
 *       ingredients: { type: 'array', items: { type: 'string' } },
 *       instructions: { type: 'array', items: { type: 'string' } }
 *     },
 *     required: ['title', 'ingredients', 'instructions'],
 *     additionalProperties: false
 *   },
 *   'recipe_response',
 *   true
 * );
 */
async chatCompletionWithSchema(
  request: Omit<ChatCompletionRequest, 'response_format'>,
  schema: JsonSchema,
  schemaName: string,
  strict: boolean = true
): Promise<ChatCompletionResponse>
```

### 3.3 `listModels`

Retrieves available models from OpenRouter API.

```typescript
/**
 * Retrieves list of available models from OpenRouter.
 *
 * @async
 * @method listModels
 * @returns {Promise<ModelListResponse>} List of available models with metadata
 *
 * @throws {ApiError} If API request fails
 */
async listModels(): Promise<ModelListResponse>
```

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultHeaders: Record<string, string>;
private readonly defaultModelParams: Partial<ChatCompletionRequest>;
```

### 4.2 `buildRequestPayload`

Constructs the request payload for OpenRouter API.

```typescript
/**
 * Builds the request payload for OpenRouter API.
 *
 * @private
 * @method buildRequestPayload
 * @param {ChatCompletionRequest} request - Request parameters
 * @returns {OpenRouterRequestPayload} Formatted payload for API
 */
private buildRequestPayload(request: ChatCompletionRequest): OpenRouterRequestPayload
```

**Implementation Details:**

1. Merge default model parameters with request parameters
2. Validate required fields (model, messages)
3. Format messages array ensuring proper role/content structure
4. Construct `response_format` object if provided:
   ```typescript
   {
     type: 'json_schema',
     json_schema: {
       name: schemaName,
       strict: strict,
       schema: schemaObject
     }
   }
   ```
5. Include optional model parameters (temperature, max_tokens, etc.)
6. Return formatted payload

### 4.3 `sendRequest`

Sends HTTP request to OpenRouter API with retry logic.

```typescript
/**
 * Sends HTTP request to OpenRouter API with error handling and retry logic.
 *
 * @private
 * @async
 * @method sendRequest
 * @param {OpenRouterRequestPayload} payload - Request payload
 * @returns {Promise<Response>} Fetch Response object
 *
 * @throws {ApiError} If request fails after retries
 */
private async sendRequest(payload: OpenRouterRequestPayload): Promise<Response>
```

**Implementation Details:**

1. Implement exponential backoff retry logic (max 3 retries)
2. Handle rate limit errors (429) with appropriate delays
3. Set timeout (30 seconds default)
4. Log request details for debugging
5. Return Response object

### 4.4 `parseResponse`

Parses and validates API response.

```typescript
/**
 * Parses and validates OpenRouter API response.
 *
 * @private
 * @async
 * @method parseResponse
 * @param {Response} response - Fetch Response object
 * @returns {Promise<ChatCompletionResponse>} Parsed response data
 *
 * @throws {ApiError} If response is invalid or contains errors
 */
private async parseResponse(response: Response): Promise<ChatCompletionResponse>
```

**Implementation Details:**

1. Check HTTP status code
2. Parse JSON response body
3. Validate response structure
4. Extract choices array and metadata
5. If `response_format` was used, parse JSON content from message
6. Return typed response object

### 4.5 `handleApiError`

Transforms OpenRouter API errors into ApiError instances.

```typescript
/**
 * Transforms OpenRouter API errors into standardized ApiError instances.
 *
 * @private
 * @method handleApiError
 * @param {Response} response - Error response from API
 * @param {unknown} errorBody - Parsed error body (if available)
 * @returns {ApiError} Standardized error instance
 */
private handleApiError(response: Response, errorBody?: unknown): ApiError
```

**Error Mapping:**

- 401 Unauthorized → `createUnauthorizedError('Invalid OpenRouter API key')`
- 402 Payment Required → `createInternalError('OpenRouter account has insufficient funds')`
- 400 Bad Request → `createValidationError('Invalid request parameters', details)`
- 429 Too Many Requests → `createInternalError('Rate limit exceeded. Please try again later.')`
- 500+ Server Errors → `createInternalError('OpenRouter API error')`

### 4.6 `validateMessages`

Validates message array structure.

```typescript
/**
 * Validates that messages array is properly formatted.
 *
 * @private
 * @method validateMessages
 * @param {ChatMessage[]} messages - Messages array to validate
 * @throws {ApiError} If validation fails
 */
private validateMessages(messages: ChatMessage[]): void
```

**Validation Rules:**

1. Messages array must not be empty
2. Each message must have `role` ('system', 'user', 'assistant')
3. Each message must have `content` (non-empty string)
4. System message (if present) must be first
5. Last message must be from 'user' role

## 5. Error Handling

### 5.1 Error Scenarios

1. **Missing or Invalid API Key**
   - **Scenario:** API key not provided in constructor or environment variable missing
   - **HTTP Status:** 401
   - **Handling:** Throw `createUnauthorizedError('OpenRouter API key is required')` in constructor
   - **User Message:** "Authentication failed. Please check API configuration."

2. **Invalid Request Parameters**
   - **Scenario:** Missing required fields (model, messages), invalid message format, invalid parameter values
   - **HTTP Status:** 400
   - **Handling:** Validate in `buildRequestPayload` and throw `createValidationError` with field-specific details
   - **User Message:** "Invalid request parameters: [specific field errors]"

3. **Insufficient Funds**
   - **Scenario:** OpenRouter account balance is too low
   - **HTTP Status:** 402
   - **Handling:** Catch in `parseResponse` and throw `createInternalError` with appropriate message
   - **User Message:** "Service temporarily unavailable. Please contact support."

4. **Rate Limit Exceeded**
   - **Scenario:** Too many requests in a short time period
   - **HTTP Status:** 429
   - **Handling:** Implement exponential backoff retry in `sendRequest` (max 3 retries with delays: 1s, 2s, 4s)
   - **User Message:** "Rate limit exceeded. Please try again in a moment."

5. **Model Not Available**
   - **Scenario:** Requested model identifier doesn't exist or is unavailable
   - **HTTP Status:** 400 or 404
   - **Handling:** Catch in `parseResponse` and throw `createValidationError('Model not available')`
   - **User Message:** "The requested model is not available. Please try a different model."

6. **Network/Timeout Errors**
   - **Scenario:** Network failure, DNS error, or request timeout
   - **HTTP Status:** N/A (network error)
   - **Handling:** Catch in `sendRequest` and throw `createInternalError('Network error occurred')`
   - **User Message:** "Network error. Please check your connection and try again."

7. **Invalid JSON Schema**
   - **Scenario:** JSON schema in `response_format` is malformed or invalid
   - **HTTP Status:** 400
   - **Handling:** Validate schema structure before sending request
   - **User Message:** "Invalid response schema format."

8. **Response Parsing Errors**
   - **Scenario:** API returns invalid JSON or unexpected response structure
   - **HTTP Status:** 200 (but invalid body)
   - **Handling:** Catch JSON parse errors in `parseResponse` and throw `createInternalError`
   - **User Message:** "Invalid response from AI service."

9. **Streaming Errors**
   - **Scenario:** Errors during streaming response processing
   - **HTTP Status:** 200 (streaming)
   - **Handling:** Handle stream errors gracefully, close connection, throw appropriate error
   - **User Message:** "Error during response streaming."

10. **Unknown API Errors**
    - **Scenario:** Unexpected error response from OpenRouter API
    - **HTTP Status:** Various
    - **Handling:** Log full error details server-side, return generic `createInternalError` to client
    - **User Message:** "An unexpected error occurred. Please try again later."

### 5.2 Error Handling Implementation Pattern

All methods should follow this pattern:

```typescript
try {
  // Validate inputs
  this.validateMessages(request.messages);

  // Build and send request
  const payload = this.buildRequestPayload(request);
  const response = await this.sendRequest(payload);

  // Parse and return response
  return await this.parseResponse(response);
} catch (error) {
  // Transform to ApiError if not already
  if (error instanceof ApiError) {
    throw error;
  }

  // Log unexpected errors
  console.error('Unexpected error in OpenRouterService:', error);
  throw createInternalError('Failed to complete chat request');
}
```

## 6. Security Considerations

### 6.1 API Key Management

1. **Environment Variables**
   - Store API key in `OPENROUTER_API_KEY` environment variable
   - Never commit API keys to version control
   - Add `OPENROUTER_API_KEY` to `.env.example` as placeholder
   - Update `src/env.d.ts` to include type definition:
     ```typescript
     interface ImportMetaEnv {
       readonly OPENROUTER_API_KEY: string;
     }
     ```

2. **Key Validation**
   - Validate API key format (if OpenRouter provides format specification)
   - Check key is present before service instantiation
   - Provide clear error messages if key is missing

3. **Key Rotation**
   - Support dynamic key updates (if needed for future features)
   - Log key-related errors without exposing key value

### 6.2 Request Security

1. **Input Sanitization**
   - Validate and sanitize all user inputs before constructing messages
   - Limit message content length to prevent abuse
   - Validate model names against allowlist (optional, for cost control)

2. **Rate Limiting**
   - Implement client-side rate limiting per user (if needed)
   - Respect OpenRouter's rate limits
   - Log rate limit violations for monitoring

3. **Data Privacy**
   - Never log full message content in production (log message length and metadata only)
   - Sanitize logs to remove sensitive user data
   - Consider PII detection and masking for logs

### 6.3 Response Security

1. **Content Validation**
   - Validate JSON schema responses match expected structure
   - Sanitize HTML/script content if displaying in UI
   - Set appropriate Content-Security-Policy headers

2. **Error Information**
   - Never expose internal error details (stack traces, API keys) to clients
   - Log detailed errors server-side only
   - Return generic error messages to clients

### 6.4 Network Security

1. **HTTPS Only**
   - Always use HTTPS for API requests (enforced by OpenRouter)
   - Validate SSL certificates

2. **Timeout Configuration**
   - Set reasonable timeouts (30 seconds default)
   - Prevent hanging requests from consuming resources

## 7. Step-by-Step Implementation Plan

### Step 1: Define TypeScript Types

**File:** `src/types.ts`

Add the following types to the existing types file:

```typescript
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
```

### Step 2: Update Environment Type Definitions

**File:** `src/env.d.ts`

Add OpenRouter API key to environment types:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}
```

### Step 3: Create OpenRouter Service Class

**File:** `src/lib/services/openrouter.service.ts`

Create the service class following this structure:

1. **Import Dependencies**

   ```typescript
   import type {
     ChatCompletionRequest,
     ChatCompletionResponse,
     ChatMessage,
     JsonSchema,
     JsonSchemaResponseFormat,
     ModelListResponse,
     OpenRouterRequestPayload,
   } from '../../types.ts';
   import {
     ApiError,
     createInternalError,
     createUnauthorizedError,
     createValidationError,
   } from '../errors/api-errors.ts';
   ```

2. **Implement Constructor**
   - Validate API key is provided
   - Initialize private fields
   - Set up default headers with Authorization Bearer token

3. **Implement `buildRequestPayload` Method**
   - Merge default parameters with request parameters
   - Validate required fields (model, messages)
   - Format `response_format` if provided:
     ```typescript
     if (request.response_format) {
       payload.response_format = {
         type: 'json_schema',
         json_schema: {
           name: request.response_format.json_schema.name,
           strict: request.response_format.json_schema.strict,
           schema: request.response_format.json_schema.schema,
         },
       };
     }
     ```
   - Include optional model parameters
   - Return formatted payload

4. **Implement `validateMessages` Method**
   - Check messages array is not empty
   - Validate each message has role and content
   - Ensure system message is first (if present)
   - Ensure last message is from user
   - Throw `createValidationError` if validation fails

5. **Implement `sendRequest` Method**
   - Use `fetch` API (native, no dependencies)
   - Implement retry logic with exponential backoff:

     ```typescript
     const maxRetries = 3;
     const baseDelay = 1000; // 1 second

     for (let attempt = 0; attempt <= maxRetries; attempt++) {
       try {
         const response = await fetch(url, {
           method: 'POST',
           headers: this.defaultHeaders,
           body: JSON.stringify(payload),
           signal: AbortSignal.timeout(30000), // 30 second timeout
         });

         if (response.status === 429 && attempt < maxRetries) {
           const delay = baseDelay * Math.pow(2, attempt);
           await new Promise((resolve) => setTimeout(resolve, delay));
           continue;
         }

         return response;
       } catch (error) {
         if (attempt === maxRetries) throw error;
         // Retry on network errors
       }
     }
     ```

   - Log request details (without sensitive data)
   - Return Response object

6. **Implement `parseResponse` Method**
   - Check HTTP status code
   - Parse JSON response body
   - Validate response structure
   - If `response_format` was used, parse JSON content from message:
     ```typescript
     if (request.response_format) {
       const content = choice.message.content;
       try {
         choice.message.content = JSON.parse(content);
       } catch {
         throw createInternalError('Failed to parse JSON response');
       }
     }
     ```
   - Return typed `ChatCompletionResponse`

7. **Implement `handleApiError` Method**
   - Map HTTP status codes to appropriate `ApiError` types
   - Extract error details from response body
   - Return standardized error

8. **Implement `chatCompletion` Public Method**
   - Validate messages using `validateMessages`
   - Build request payload using `buildRequestPayload`
   - Send request using `sendRequest`
   - Parse response using `parseResponse`
   - Handle errors using `handleApiError`
   - Return `ChatCompletionResponse`

9. **Implement `chatCompletionWithSchema` Public Method**
   - Construct `response_format` object:
     ```typescript
     const responseFormat: JsonSchemaResponseFormat = {
       type: 'json_schema',
       json_schema: {
         name: schemaName,
         strict: strict,
         schema: schema,
       },
     };
     ```
   - Merge with request parameters
   - Call `chatCompletion` with merged request
   - Return response

10. **Implement `listModels` Public Method**
    - Send GET request to `/models` endpoint
    - Parse and return `ModelListResponse`

### Step 4: Create Validation Utilities (Optional)

**File:** `src/lib/validation/openrouter.validation.ts`

Create validation functions for OpenRouter-specific inputs:

```typescript
import { createValidationError } from '../errors/api-errors.ts';
import type { ChatMessage, ChatCompletionRequest } from '../../types.ts';

export function validateChatMessages(messages: ChatMessage[]): void {
  if (!messages || messages.length === 0) {
    throw createValidationError('Messages array cannot be empty');
  }

  // Additional validation logic
}

export function validateModelName(model: string): void {
  // Optional: validate against allowlist or format
}
```

### Step 5: Create Example Usage Documentation

**File:** `src/lib/services/openrouter.service.example.ts` (optional, for documentation)

Create example usage patterns:

```typescript
/**
 * Example usage of OpenRouterService
 */

import { OpenRouterService } from './openrouter.service.ts';

// Example 1: Basic chat completion
const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);

const response = await service.chatCompletion({
  model: 'openai/gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the weather in London?' },
  ],
  temperature: 0.7,
  max_tokens: 500,
});

console.log(response.choices[0].message.content);

// Example 2: Structured JSON response with schema
const recipeResponse = await service.chatCompletionWithSchema(
  {
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: 'You are a recipe generator.' },
      { role: 'user', content: 'Generate a recipe for pasta carbonara' },
    ],
    temperature: 0.8,
    max_tokens: 1000,
  },
  {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Recipe title' },
      ingredients: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of ingredients',
      },
      instructions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Step-by-step instructions',
      },
      prep_time: { type: 'number', description: 'Preparation time in minutes' },
      cook_time: { type: 'number', description: 'Cooking time in minutes' },
    },
    required: ['title', 'ingredients', 'instructions'],
    additionalProperties: false,
  },
  'recipe_response',
  true // strict mode
);

// Response content will be parsed JSON object
const recipe = recipeResponse.choices[0].message.content;
console.log(recipe.title); // Type-safe access
console.log(recipe.ingredients); // Array of strings
```

### Step 6: Update Error Codes (if needed)

**File:** `src/lib/errors/api-errors.ts`

Add new error code if needed for OpenRouter-specific errors:

```typescript
export const ERROR_CODES = {
  // ... existing codes
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR', // For OpenRouter API errors
} as const;
```

### Step 7: Testing Considerations

Create unit tests for:

1. Constructor validation (missing API key)
2. Message validation (empty array, invalid roles, etc.)
3. Request payload building (with and without response_format)
4. Error handling (all error scenarios)
5. Response parsing (normal and JSON schema responses)
6. Retry logic (rate limit handling)

### Step 8: Integration Example

**File:** `src/pages/api/chat/example.ts` (example endpoint)

```typescript
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import { createApiErrorResponse, ApiError } from '@/lib/errors/api-errors';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
    const response = await service.chatCompletion({
      model: body.model || 'openai/gpt-4o',
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiErrorResponse(error);
    }
    console.error('Unexpected error:', error);
    return createApiErrorResponse(createInternalError());
  }
};
```

## Implementation Checklist

- [ ] Add TypeScript types to `src/types.ts`
- [ ] Update `src/env.d.ts` with `OPENROUTER_API_KEY`
- [ ] Create `src/lib/services/openrouter.service.ts` with full implementation
- [ ] Implement constructor with API key validation
- [ ] Implement `buildRequestPayload` with response_format support
- [ ] Implement `validateMessages` method
- [ ] Implement `sendRequest` with retry logic
- [ ] Implement `parseResponse` with JSON schema parsing
- [ ] Implement `handleApiError` with error mapping
- [ ] Implement `chatCompletion` public method
- [ ] Implement `chatCompletionWithSchema` public method
- [ ] Implement `listModels` public method
- [ ] Add error handling for all scenarios
- [ ] Add comprehensive JSDoc comments
- [ ] Create example usage documentation
- [ ] Test with various models and parameters
- [ ] Test error scenarios
- [ ] Test JSON schema responses
- [ ] Update `.env.example` with `OPENROUTER_API_KEY` placeholder

## Key Implementation Notes

1. **Response Format Pattern:** Always use this exact structure for `response_format`:

   ```typescript
   {
     type: 'json_schema',
     json_schema: {
       name: 'schema_name',
       strict: true,
       schema: { /* JSON Schema object */ }
     }
   }
   ```

2. **Message Structure:** Ensure messages follow this format:

   ```typescript
   [
     { role: 'system', content: 'System message (optional, must be first)' },
     { role: 'user', content: 'User message' },
     {
       role: 'assistant',
       content: 'Assistant response (for conversation history)',
     },
     { role: 'user', content: 'Follow-up user message' },
   ];
   ```

3. **Error Handling:** Always use the existing `ApiError` pattern from `api-errors.ts` for consistency.

4. **Logging:** Log request metadata (model, message count, token usage) but never log full message content or API keys in production.

5. **Type Safety:** Use TypeScript types throughout to ensure compile-time safety and better IDE support.
