/**
 * @module openrouter.service
 * @description Service layer for interacting with OpenRouter API to complete LLM-based chat conversations.
 * Provides a clean abstraction for constructing requests, handling responses, and managing errors
 * when communicating with OpenRouter's chat completion API.
 *
 * This service implements the following features:
 * - Chat completion requests with customizable model parameters
 * - Structured JSON schema responses via response_format
 * - Comprehensive error handling and retry logic
 * - Model listing and information retrieval
 * - Secure API key management
 *
 * @requires ../../types - OpenRouter-related type definitions
 * @requires ../errors/api-errors - Error handling utilities
 *
 * @example
 * // Initialize service in API route
 * import { OpenRouterService } from '@/lib/services/openrouter.service';
 *
 * export async function POST(context: APIContext) {
 *   const service = new OpenRouterService(import.meta.env.OPEN_ROUTER_API_KEY);
 *   const response = await service.chatCompletion({
 *     model: 'openai/gpt-4o',
 *     messages: [
 *       { role: 'system', content: 'You are a helpful assistant.' },
 *       { role: 'user', content: 'What is the weather in London?' }
 *     ],
 *     temperature: 0.7,
 *     max_tokens: 500
 *   });
 *   return new Response(JSON.stringify(response));
 * }
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  ChatMessageRole,
  JsonSchema,
  JsonSchemaResponseFormat,
  ModelListResponse,
  OpenRouterRequestPayload,
} from '@/types.ts';
import {
  ApiError,
  createInternalError,
  createUnauthorizedError,
  createValidationError,
} from '@/lib/errors/api-errors.ts';

/**
 * Service class for OpenRouter API interactions.
 *
 * This service provides a clean abstraction layer over OpenRouter's chat completion API,
 * handling request construction, response parsing, error handling, and retry logic.
 * All operations include comprehensive error handling and follow security best practices.
 *
 * @class OpenRouterService
 *
 * @property {string} apiKey - OpenRouter API key (private, readonly)
 * @property {string} baseUrl - Base URL for OpenRouter API (private, readonly)
 * @property {Record<string, string>} defaultHeaders - Default HTTP headers for requests (private, readonly)
 * @property {Partial<ChatCompletionRequest>} defaultModelParams - Default model parameters (private, readonly)
 *
 * @example
 * // Instantiate service with API key from environment
 * const service = new OpenRouterService(import.meta.env.OPEN_ROUTER_API_KEY);
 *
 * @example
 * // Use in API route
 * export async function POST(context: APIContext) {
 *   const service = new OpenRouterService(import.meta.env.OPEN_ROUTER_API_KEY);
 *   const response = await service.chatCompletion({
 *     model: 'openai/gpt-4o',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *     temperature: 0.7
 *   });
 *   return new Response(JSON.stringify(response));
 * }
 *
 * @remarks
 * - API key must be provided in constructor or via OPEN_ROUTER_API_KEY environment variable
 * - All requests include automatic retry logic for transient errors (429, network errors)
 * - Response format with JSON schema automatically parses JSON content
 * - Errors are transformed into standardized ApiError instances
 * - Request metadata is logged (without sensitive data) for debugging
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultModelParams: Partial<ChatCompletionRequest> = {
    temperature: 1,
  };

  /**
   * Creates a new OpenRouterService instance.
   *
   * @constructor
   * @param {string} apiKey - OpenRouter API key from environment variables (OPEN_ROUTER_API_KEY)
   * @param {string} [baseUrl='https://openrouter.ai/api/v1'] - Optional base URL for OpenRouter API
   *
   * @throws {ApiError} If apiKey is not provided or is empty (UNAUTHORIZED, 401)
   *
   * @example
   * const service = new OpenRouterService(import.meta.env.OPEN_ROUTER_API_KEY);
   *
   * @example
   * // With custom base URL (for testing or custom deployments)
   * const service = new OpenRouterService(
   *   import.meta.env.OPEN_ROUTER_API_KEY,
   *   'https://custom-openrouter.example.com/api/v1'
   * );
   */
  constructor(apiKey: string, baseUrl = 'https://openrouter.ai/api/v1') {
    // Validate API key is provided
    if (!apiKey || apiKey.trim().length === 0) {
      throw createUnauthorizedError('OpenRouter API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    // Initialize default headers with Authorization Bearer token
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer':
        typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'AI Healthy Meal',
    };
  }

  /**
   * Validates that messages array is properly formatted.
   *
   * @private
   * @method validateMessages
   * @param {ChatMessage[]} messages - Messages array to validate
   * @throws {ApiError} If validation fails (VALIDATION_ERROR, 400)
   *
   * @remarks
   * Validation rules:
   * - Messages array must not be empty
   * - Each message must have valid role ('system', 'user', 'assistant')
   * - Each message must have non-empty content string
   * - System message (if present) must be first
   * - Last message must be from 'user' role
   */
  private validateMessages(messages: ChatMessage[]): void {
    if (!messages || messages.length === 0) {
      throw createValidationError('Messages array cannot be empty');
    }

    const validRoles: ChatMessageRole[] = ['system', 'user', 'assistant'];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (!message.role || !validRoles.includes(message.role)) {
        throw createValidationError(
          `Invalid message role at index ${i}. Must be one of: ${validRoles.join(', ')}`
        );
      }

      if (!message.content || message.content.trim().length === 0) {
        throw createValidationError(
          `Message at index ${i} must have non-empty content string`
        );
      }

      // System message must be first
      if (message.role === 'system' && i !== 0) {
        throw createValidationError(
          'System message must be the first message in the array'
        );
      }
    }

    // Last message must be from user
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      throw createValidationError('Last message must be from user role');
    }
  }

  /**
   * Builds the request payload for OpenRouter API.
   *
   * @private
   * @method buildRequestPayload
   * @param {ChatCompletionRequest} request - Request parameters
   * @returns {OpenRouterRequestPayload} Formatted payload for API
   *
   * @throws {ApiError} If required fields are missing (VALIDATION_ERROR, 400)
   *
   * @remarks
   * - Merges default model parameters with request parameters
   * - Validates required fields (model, messages)
   * - Formats response_format object if provided
   * - Includes optional model parameters
   */
  private buildRequestPayload(
    request: ChatCompletionRequest
  ): OpenRouterRequestPayload {
    // Validate required fields
    if (!request.model || request.model.trim().length === 0) {
      throw createValidationError('Model name is required');
    }

    // Validate messages (this will throw if invalid)
    this.validateMessages(request.messages);

    // Build payload with merged defaults
    const payload: OpenRouterRequestPayload = {
      model: request.model,
      messages: request.messages,
    };

    // Add response_format if provided
    // OpenRouter expects response_format in a specific format
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

    // Merge optional model parameters (request overrides defaults)
    if (request.temperature !== undefined) {
      payload.temperature = request.temperature;
    } else if (this.defaultModelParams.temperature !== undefined) {
      payload.temperature = this.defaultModelParams.temperature;
    }

    if (request.max_tokens !== undefined) {
      payload.max_tokens = request.max_tokens;
    }

    if (request.top_p !== undefined) {
      payload.top_p = request.top_p;
    }

    if (request.frequency_penalty !== undefined) {
      payload.frequency_penalty = request.frequency_penalty;
    }

    if (request.presence_penalty !== undefined) {
      payload.presence_penalty = request.presence_penalty;
    }

    if (request.stop !== undefined && request.stop.length > 0) {
      payload.stop = request.stop;
    }

    if (request.stream !== undefined) {
      payload.stream = request.stream;
    }

    return payload;
  }

  /**
   * Transforms OpenRouter API errors into standardized ApiError instances.
   *
   * @private
   * @method handleApiError
   * @param {Response} response - Error response from API
   * @param {unknown} errorBody - Parsed error body (if available)
   * @returns {ApiError} Standardized error instance
   *
   * @remarks
   * Error mapping:
   * - 401 Unauthorized → UNAUTHORIZED error
   * - 402 Payment Required → INTERNAL_ERROR (insufficient funds)
   * - 400 Bad Request → VALIDATION_ERROR
   * - 429 Too Many Requests → INTERNAL_ERROR (rate limit)
   * - 500+ Server Errors → INTERNAL_ERROR
   */
  private handleApiError(response: Response, errorBody?: unknown): ApiError {
    const status = response.status;

    // Try to extract error message from response body
    let errorMessage = 'OpenRouter API error';
    let errorDetails: Record<string, unknown> | undefined;

    // Log full error for debugging
    console.error('[OpenRouter] API Error Response:', {
      status,
      errorBody: JSON.stringify(errorBody, null, 2),
    });

    if (errorBody && typeof errorBody === 'object') {
      const body = errorBody as Record<string, unknown>;
      if (
        'error' in body &&
        typeof body.error === 'object' &&
        body.error !== null
      ) {
        const error = body.error as Record<string, unknown>;
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        if ('code' in error) {
          errorDetails = { apiErrorCode: error.code };
        }
        // Include additional error fields if present
        if ('type' in error) {
          errorDetails = { ...errorDetails, errorType: error.type };
        }
      } else if ('message' in body && typeof body.message === 'string') {
        errorMessage = body.message;
      }
      // Check for OpenRouter-specific error format
      if ('error' in body && typeof body.error === 'string') {
        errorMessage = body.error as string;
      }
    }

    // Map HTTP status codes to appropriate error types
    if (status === 401) {
      return createUnauthorizedError('Invalid OpenRouter API key');
    }

    if (status === 402) {
      return createInternalError('OpenRouter account has insufficient funds');
    }

    if (status === 400) {
      return createValidationError(errorMessage, errorDetails);
    }

    if (status === 429) {
      return createInternalError(
        'Rate limit exceeded. Please try again later.'
      );
    }

    if (status >= 500) {
      return createInternalError('OpenRouter API server error');
    }

    // Default for other status codes
    return createInternalError(errorMessage);
  }

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
   *
   * @remarks
   * - Implements exponential backoff retry logic (max 3 retries)
   * - Handles rate limit errors (429) with appropriate delays
   * - Sets 30 second timeout for requests
   * - Logs request metadata (without sensitive data) for debugging
   */
  private async sendRequest(
    payload: OpenRouterRequestPayload
  ): Promise<Response> {
    const url = `${this.baseUrl}/chat/completions`;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          method: 'POST',
          headers: this.defaultHeaders,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle rate limit with retry
        if (response.status === 429 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If not rate limit, return response (success or error)
        return response;
      } catch (error) {
        // Handle network errors and timeouts
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw createInternalError('Request timeout after 30 seconds');
          }

          // Network errors - retry if attempts remaining
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // Last attempt failed
          throw createInternalError(`Network error: ${error.message}`);
        }

        // Unknown error type
        throw createInternalError('Unexpected error during request');
      }
    }

    // This should never be reached, but TypeScript requires it
    throw createInternalError('Request failed after all retries');
  }

  /**
   * Parses and validates OpenRouter API response.
   *
   * @private
   * @async
   * @method parseResponse
   * @param {Response} response - Fetch Response object
   * @param {ChatCompletionRequest} originalRequest - Original request to check for response_format
   * @returns {Promise<ChatCompletionResponse>} Parsed response data
   *
   * @throws {ApiError} If response is invalid or contains errors
   *
   * @remarks
   * - Checks HTTP status code and handles errors
   * - Parses JSON response body
   * - Validates response structure matches ChatCompletionResponse type
   * - If response_format was used, parses JSON content from message string
   * - Returns typed ChatCompletionResponse object
   */
  private async parseResponse(
    response: Response,
    originalRequest: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    // Handle non-200 status codes
    if (!response.ok) {
      let errorBody: unknown;
      try {
        const text = await response.text();
        console.error('[OpenRouter] Error response text:', text);
        try {
          errorBody = JSON.parse(text);
        } catch {
          // If JSON parsing fails, use text as message
          errorBody = { message: text || response.statusText };
        }
      } catch {
        // If reading fails, use status text
        errorBody = { message: response.statusText };
      }

      // Log full error details for debugging
      console.error('[OpenRouter] API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: JSON.stringify(errorBody, null, 2),
      });

      throw this.handleApiError(response, errorBody);
    }

    // Parse JSON response
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error('[OpenRouter] Failed to parse JSON response:', error);
      throw createInternalError('Invalid JSON response from OpenRouter API');
    }

    // Validate response structure
    if (
      !responseData ||
      typeof responseData !== 'object' ||
      !('id' in responseData) ||
      !('model' in responseData) ||
      !('choices' in responseData) ||
      !('usage' in responseData)
    ) {
      console.error('[OpenRouter] Invalid response structure:', responseData);
      throw createInternalError(
        'Invalid response structure from OpenRouter API'
      );
    }

    const data = responseData as {
      id: string;
      model: string;
      choices: unknown[];
      usage: unknown;
      created?: number;
    };

    // Validate choices array
    if (!Array.isArray(data.choices) || data.choices.length === 0) {
      throw createInternalError('Response contains no choices');
    }

    // Validate and transform choices
    const choices = data.choices.map((choice: unknown, index: number) => {
      if (
        !choice ||
        typeof choice !== 'object' ||
        !('index' in choice) ||
        !('message' in choice)
      ) {
        throw createInternalError(`Invalid choice structure at index ${index}`);
      }

      const choiceObj = choice as {
        index: number;
        message: unknown;
        finish_reason?: string | null;
      };

      if (
        !choiceObj.message ||
        typeof choiceObj.message !== 'object' ||
        !('role' in choiceObj.message) ||
        !('content' in choiceObj.message)
      ) {
        throw createInternalError(
          `Invalid message structure in choice at index ${index}`
        );
      }

      const message = choiceObj.message as {
        role: string;
        content: string;
      };

      // If response_format was used, parse JSON content
      if (originalRequest.response_format) {
        try {
          message.content = JSON.parse(message.content);
        } catch (parseError) {
          console.error(
            '[OpenRouter] Failed to parse JSON content from response_format:',
            parseError
          );
          throw createInternalError('Failed to parse JSON response content');
        }
      }

      return {
        index: choiceObj.index,
        message: {
          role: message.role as ChatMessageRole,
          content: message.content,
        },
        finish_reason:
          (choiceObj.finish_reason as
            | 'stop'
            | 'length'
            | 'tool_calls'
            | 'content_filter'
            | null) || null,
      };
    });

    // Validate usage statistics
    if (
      !data.usage ||
      typeof data.usage !== 'object' ||
      !('prompt_tokens' in data.usage) ||
      !('completion_tokens' in data.usage) ||
      !('total_tokens' in data.usage)
    ) {
      throw createInternalError('Invalid usage statistics in response');
    }

    const usage = data.usage as {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };

    // Build and return typed response
    return {
      id: data.id,
      model: data.model,
      choices,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      },
      created: data.created || Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Sends a chat completion request to OpenRouter API.
   *
   * @async
   * @method chatCompletion
   * @param {ChatCompletionRequest} request - Request parameters
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
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      // Validate messages
      this.validateMessages(request.messages);

      // Build request payload
      const payload = this.buildRequestPayload(request);

      // Send request with retry logic
      const response = await this.sendRequest(payload);

      // Parse and return response
      return await this.parseResponse(response, request);
    } catch (error) {
      // Transform to ApiError if not already
      if (error instanceof ApiError) {
        throw error;
      }

      // Log unexpected errors
      console.error('[OpenRouter] Unexpected error in chatCompletion:', error);
      throw createInternalError('Failed to complete chat request');
    }
  }

  /**
   * Sends a chat completion request with JSON schema response format.
   *
   * @async
   * @method chatCompletionWithSchema
   * @param {Omit<ChatCompletionRequest, 'response_format'>} request - Request parameters (response_format will be overridden)
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
   *       ingredients: { type: 'array', items: { type: 'string' } }
   *     },
   *     required: ['title', 'ingredients']
   *   },
   *   'recipe_response',
   *   true
   * );
   */
  async chatCompletionWithSchema(
    request: Omit<ChatCompletionRequest, 'response_format'>,
    schema: JsonSchema,
    schemaName: string,
    strict = true
  ): Promise<ChatCompletionResponse> {
    // Construct response_format object
    const responseFormat: JsonSchemaResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        strict: strict,
        schema: schema,
      },
    };

    // Merge with request parameters
    const fullRequest: ChatCompletionRequest = {
      ...request,
      response_format: responseFormat,
    };

    // Call chatCompletion with merged request
    return await this.chatCompletion(fullRequest);
  }

  /**
   * Retrieves list of available models from OpenRouter.
   *
   * @async
   * @method listModels
   * @returns {Promise<ModelListResponse>} List of available models with metadata
   *
   * @throws {ApiError} If API request fails
   */
  async listModels(): Promise<ModelListResponse> {
    try {
      const url = `${this.baseUrl}/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { message: response.statusText };
        }
        throw this.handleApiError(response, errorBody);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.data)) {
        throw createInternalError('Invalid model list response structure');
      }

      return data as ModelListResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('[OpenRouter] Unexpected error in listModels:', error);
      throw createInternalError('Failed to retrieve model list');
    }
  }

  /**
   * Generates a new recipe based on existing user recipes.
   *
   * This method takes a list of existing recipes and uses them as inspiration/context
   * to generate a new recipe using AI. The generated recipe will be similar in style
   * or combine elements from the provided recipes.
   *
   * @async
   * @method generateRecipeFromExisting
   * @param {Object} params - Generation parameters
   * @param {Array<{title: string, content: string}>} params.existingRecipes - Array of existing recipes to use as inspiration
   * @param {string} [params.model='openai/gpt-4o'] - Model identifier to use for generation
   * @param {string} [params.customPrompt] - Optional custom prompt to guide generation
   * @param {number} [params.temperature=0.8] - Sampling temperature (0-2, higher = more creative)
   * @param {number} [params.max_tokens=2000] - Maximum tokens in response
   *
   * @returns {Promise<ChatCompletionResponse>} API response with generated recipe as JSON object
   *
   * @throws {ApiError} If request validation fails or API returns an error
   *
   * @example
   * const response = await service.generateRecipeFromExisting({
   *   existingRecipes: [
   *     { title: 'Pasta Carbonara', content: 'Cook pasta, mix with eggs and bacon...' },
   *     { title: 'Spaghetti Aglio e Olio', content: 'Sauté garlic in olive oil, add pasta...' }
   *   ],
   *   customPrompt: 'Create a fusion recipe combining these Italian pasta dishes',
   *   temperature: 0.9
   * });
   *
   * const recipe = response.choices[0].message.content; // Parsed JSON object
   * console.log(recipe.title); // "Fusion Pasta Dish"
   * console.log(recipe.ingredients); // Array of ingredients
   */
  async generateRecipeFromExisting(params: {
    existingRecipes: { title: string; content: string }[];
    model?: string;
    customPrompt?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<ChatCompletionResponse> {
    // Check if we have preferences in customPrompt (indicates generation from preferences)
    const hasPreferences = params.customPrompt?.includes('User preferences:');

    // Validate input: need either existing recipes OR preferences
    if (
      (!params.existingRecipes || params.existingRecipes.length === 0) &&
      !hasPreferences
    ) {
      throw createValidationError(
        'At least one existing recipe is required for generation, or provide dietary preferences'
      );
    }

    // Build context from existing recipes (if any)
    const recipesContext =
      params.existingRecipes && params.existingRecipes.length > 0
        ? params.existingRecipes
            .map(
              (recipe, index) =>
                `Recipe ${index + 1}: ${recipe.title}\n${recipe.content}`
            )
            .join('\n\n---\n\n')
        : null;

    // Build system message
    let systemMessage = `You are an expert chef and recipe creator. Your task is to generate a new, creative recipe.`;

    if (recipesContext) {
      systemMessage += ` The new recipe should:
- Be inspired by the style, ingredients, or techniques from the existing recipes
- Be a unique, creative combination or variation`;
    } else {
      systemMessage += ` The new recipe should:
- Be created based on the user's dietary preferences and requirements`;
    }

    systemMessage += `
- Include clear, step-by-step instructions
- List all ingredients with quantities
- Be practical and achievable for home cooking

Generate the recipe in the exact JSON format specified.`;

    // Build user message
    let userMessage = '';
    if (recipesContext) {
      userMessage = `Based on these existing recipes:\n\n${recipesContext}\n\n`;
      if (params.customPrompt) {
        userMessage += `${params.customPrompt}\n\n`;
      }
      userMessage +=
        'Generate a new, creative recipe inspired by these recipes. Make it unique while drawing inspiration from the provided examples.';
    } else {
      // Generating from preferences only
      userMessage = params.customPrompt || '';
      userMessage +=
        '\n\nGenerate a new, creative recipe that meets these requirements. Make it delicious, practical, and suitable for home cooking.';
    }

    // Define recipe JSON schema
    // Note: When using strict mode, ALL properties must be in the required array
    // So we'll use non-strict mode or only include required properties
    const recipeSchema: JsonSchema = {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Recipe title',
        },
        description: {
          type: 'string',
          description: 'Brief description of the recipe',
        },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Ingredient name' },
              quantity: {
                type: 'string',
                description: 'Quantity and unit (e.g., "2 cups", "500g")',
              },
            },
            required: ['name', 'quantity'],
            additionalProperties: false,
          },
          description: 'List of ingredients with quantities',
        },
        instructions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Step-by-step cooking instructions',
        },
        prep_time: {
          type: 'number',
          description: 'Preparation time in minutes',
        },
        cook_time: {
          type: 'number',
          description: 'Cooking time in minutes',
        },
        servings: {
          type: 'number',
          description: 'Number of servings',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
          description: 'Difficulty level',
        },
      },
      // Only include truly required fields in required array
      // Optional fields (description, prep_time, cook_time, servings, difficulty)
      // can be omitted by the model
      required: ['title', 'ingredients', 'instructions'],
      additionalProperties: false,
    };

    // Call chatCompletionWithSchema with strict: false to allow optional fields
    // Strict mode requires ALL properties to be in required array, which doesn't work
    // for optional fields like description, prep_time, etc.
    return await this.chatCompletionWithSchema(
      {
        model: params.model || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: params.temperature ?? 0.8,
        max_tokens: params.max_tokens ?? 2000,
      },
      recipeSchema,
      'generated_recipe',
      false // Set to false to allow optional fields
    );
  }
}
