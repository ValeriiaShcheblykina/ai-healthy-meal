import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import {
  createUnauthorizedError,
  createInternalError,
} from '@/lib/errors/api-errors';
import type {
  ChatCompletionRequest,
  ChatMessage,
  ChatMessageRole,
  OpenRouterRequestPayload,
  ChatCompletionResponse,
} from '@/types';

// Type for accessing private methods in tests
// Since private methods can't be accessed via intersection types,
// we define a separate interface that matches the private method signatures
interface OpenRouterServicePrivateMethods {
  validateMessages: (messages: ChatMessage[] | null) => void;
  buildRequestPayload: (
    request: Partial<ChatCompletionRequest>
  ) => OpenRouterRequestPayload;
  handleApiError: (
    response: Response,
    errorBody?: unknown
  ) => ReturnType<typeof createInternalError>;
  sendRequest: (payload: OpenRouterRequestPayload) => Promise<Response>;
  parseResponse: (
    response: Response,
    originalRequest: ChatCompletionRequest
  ) => Promise<ChatCompletionResponse>;
}
// Mock fetch globally
global.fetch = vi.fn();

describe('OpenRouterService', () => {
  const API_KEY = 'test-api-key';
  let service: OpenRouterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenRouterService(API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create service with valid API key', () => {
      const service = new OpenRouterService(API_KEY);
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it('should throw error with empty API key', () => {
      expect(() => new OpenRouterService('')).toThrow('API key is required');
    });

    it('should throw error with whitespace-only API key', () => {
      expect(() => new OpenRouterService('   ')).toThrow('API key is required');
    });

    it('should accept custom base URL', () => {
      const customUrl = 'https://custom.example.com/api/v1';
      const service = new OpenRouterService(API_KEY, customUrl);
      expect(service).toBeInstanceOf(OpenRouterService);
    });
  });

  describe('validateMessages', () => {
    it('should throw error for empty messages array', () => {
      expect(() => {
        // Access private method via type assertion (using unknown for type safety)
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([]);
      }).toThrow();
    });

    it('should throw error for null messages', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages(null);
      }).toThrow();
    });

    it('should throw error for invalid message role', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([
          { role: 'invalid' as ChatMessageRole, content: 'test' },
        ]);
      }).toThrow();
    });

    it('should throw error for empty message content', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([{ role: 'user', content: '' }]);
      }).toThrow();
    });

    it('should throw error when system message is not first', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([
          { role: 'user', content: 'test' },
          { role: 'system', content: 'system message' },
        ]);
      }).toThrow();
    });

    it('should throw error when last message is not from user', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([{ role: 'assistant', content: 'response' }]);
      }).toThrow();
    });

    it('should accept valid messages array', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([{ role: 'user', content: 'Hello' }]);
      }).not.toThrow();
    });

    it('should accept system message as first message', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).validateMessages([
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
        ]);
      }).not.toThrow();
    });
  });

  describe('buildRequestPayload', () => {
    it('should build payload with required fields', () => {
      const request: Partial<ChatCompletionRequest> = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const payload = (
        service as unknown as OpenRouterServicePrivateMethods
      ).buildRequestPayload(request);

      expect(payload.model).toBe('openai/gpt-4o');
      expect(payload.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    });

    it('should throw error for missing model', () => {
      expect(() => {
        (
          service as unknown as OpenRouterServicePrivateMethods
        ).buildRequestPayload({
          messages: [{ role: 'user', content: 'Hello' }],
        });
      }).toThrow('Model name is required');
    });

    it('should include response_format when provided', () => {
      const request: Partial<ChatCompletionRequest> = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'test_schema',
            strict: true,
            schema: { type: 'object' },
          },
        },
      };

      const payload = (
        service as unknown as OpenRouterServicePrivateMethods
      ).buildRequestPayload(request);

      expect(payload.response_format).toBeDefined();
      expect(payload.response_format?.type).toBe('json_schema');
    });

    it('should include optional parameters', () => {
      const request: Partial<ChatCompletionRequest> = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
      };

      const payload = (
        service as unknown as OpenRouterServicePrivateMethods
      ).buildRequestPayload(request);

      expect(payload.temperature).toBe(0.7);
      expect(payload.max_tokens).toBe(500);
      expect(payload.top_p).toBe(0.9);
    });

    it('should use default temperature when not provided', () => {
      const request: Partial<ChatCompletionRequest> = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const payload = (
        service as unknown as OpenRouterServicePrivateMethods
      ).buildRequestPayload(request);

      expect(payload.temperature).toBe(1);
    });
  });

  describe('handleApiError', () => {
    it('should handle 401 Unauthorized', () => {
      const response = new Response(null, { status: 401 });
      const error = (
        service as unknown as OpenRouterServicePrivateMethods
      ).handleApiError(response, {
        error: { message: 'Invalid API key' },
      });

      expect(error).toBeInstanceOf(createUnauthorizedError().constructor);
    });

    it('should handle 402 Payment Required', () => {
      const response = new Response(null, { status: 402 });
      const error = (
        service as unknown as OpenRouterServicePrivateMethods
      ).handleApiError(response);

      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('insufficient funds');
    });

    it('should handle 400 Bad Request', () => {
      const response = new Response(null, { status: 400 });
      const error = (
        service as unknown as OpenRouterServicePrivateMethods
      ).handleApiError(response, {
        error: { message: 'Invalid request' },
      });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should handle 429 Rate Limit', () => {
      const response = new Response(null, { status: 429 });
      const error = (
        service as unknown as OpenRouterServicePrivateMethods
      ).handleApiError(response);

      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('Rate limit');
    });

    it('should handle 500+ Server Errors', () => {
      const response = new Response(null, { status: 500 });
      const error = (
        service as unknown as OpenRouterServicePrivateMethods
      ).handleApiError(response);

      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('server error');
    });

    it('should extract error message from response body', () => {
      const response = new Response(null, { status: 400 });
      const error = (
        service as unknown as OpenRouterServicePrivateMethods
      ).handleApiError(response, {
        error: { message: 'Custom error message', code: 'INVALID_INPUT' },
      });

      expect(error.message).toBe('Custom error message');
    });
  });

  describe('sendRequest', () => {
    it('should send request successfully', async () => {
      const mockResponse = new Response(
        JSON.stringify({ id: 'test', choices: [] }),
        { status: 200 }
      );

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const payload: OpenRouterRequestPayload = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await (
        service as unknown as OpenRouterServicePrivateMethods
      ).sendRequest(payload);

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(response.status).toBe(200);
    });

    it('should retry on 429 rate limit', async () => {
      const mockResponse = new Response(null, { status: 429 });

      vi.mocked(fetch)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'test', choices: [] }), {
            status: 200,
          })
        );

      const payload: OpenRouterRequestPayload = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await (
        service as unknown as OpenRouterServicePrivateMethods
      ).sendRequest(payload);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    it('should handle timeout', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      // Mock fetch to reject with abort error (simulating timeout)
      vi.mocked(fetch).mockImplementation(() => {
        return Promise.reject(abortError);
      });

      const payload: OpenRouterRequestPayload = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(
        (service as unknown as OpenRouterServicePrivateMethods).sendRequest(
          payload
        )
      ).rejects.toThrow();
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(fetch)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'test', choices: [] }), {
            status: 200,
          })
        );

      const payload: OpenRouterRequestPayload = {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await (
        service as unknown as OpenRouterServicePrivateMethods
      ).sendRequest(payload);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });
  });

  describe('parseResponse', () => {
    it('should parse valid response', async () => {
      const mockResponseData = {
        id: 'chat-123',
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
        created: 1234567890,
      };

      const response = new Response(JSON.stringify(mockResponseData), {
        status: 200,
      });

      const parsed = await (
        service as unknown as OpenRouterServicePrivateMethods
      ).parseResponse(response, {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(parsed.id).toBe('chat-123');
      expect(parsed.choices).toHaveLength(1);
      expect(parsed.choices[0].message.content).toBe('Hello!');
    });

    it('should parse JSON content when response_format is used', async () => {
      const mockResponseData = {
        id: 'chat-123',
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '{"title":"Recipe","ingredients":[]}',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      const response = new Response(JSON.stringify(mockResponseData), {
        status: 200,
      });

      const parsed = await (
        service as unknown as OpenRouterServicePrivateMethods
      ).parseResponse(response, {
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Generate recipe' }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recipe',
            strict: true,
            schema: { type: 'object' },
          },
        },
      });

      expect(typeof parsed.choices[0].message.content).toBe('object');
      expect(parsed.choices[0].message.content).toEqual({
        title: 'Recipe',
        ingredients: [],
      });
    });

    it('should throw error for invalid response structure', async () => {
      const response = new Response(JSON.stringify({ invalid: 'data' }), {
        status: 200,
      });

      await expect(
        (service as unknown as OpenRouterServicePrivateMethods).parseResponse(
          response,
          {
            model: 'openai/gpt-4o',
            messages: [{ role: 'user', content: 'Hello' }],
          }
        )
      ).rejects.toThrow();
    });

    it('should throw error for non-200 status', async () => {
      const response = new Response(
        JSON.stringify({ error: { message: 'Error' } }),
        { status: 400 }
      );

      await expect(
        (service as unknown as OpenRouterServicePrivateMethods).parseResponse(
          response,
          {
            model: 'openai/gpt-4o',
            messages: [{ role: 'user', content: 'Hello' }],
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('chatCompletion', () => {
    it('should complete chat successfully', async () => {
      const mockResponseData = {
        id: 'chat-123',
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponseData), { status: 200 })
      );

      const result = await service.chatCompletion({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.id).toBe('chat-123');
      expect(result.choices[0].message.content).toBe('Hello! How can I help?');
    });

    it('should throw error for invalid messages', async () => {
      await expect(
        service.chatCompletion({
          model: 'openai/gpt-4o',
          messages: [],
        })
      ).rejects.toThrow('Messages array cannot be empty');
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'Invalid request' } }),
          { status: 400 }
        )
      );

      await expect(
        service.chatCompletion({
          model: 'openai/gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow();
    });
  });

  describe('chatCompletionWithSchema', () => {
    it('should complete chat with JSON schema', async () => {
      const mockResponseData = {
        id: 'chat-123',
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '{"title":"Recipe"}',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponseData), { status: 200 })
      );

      const result = await service.chatCompletionWithSchema(
        {
          model: 'openai/gpt-4o',
          messages: [{ role: 'user', content: 'Generate recipe' }],
        },
        {
          type: 'object',
          properties: {
            title: { type: 'string' },
          },
        },
        'recipe_schema',
        true
      );

      expect(result.id).toBe('chat-123');
      expect(typeof result.choices[0].message.content).toBe('object');
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const mockResponseData = {
        data: [
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            pricing: { prompt: '0.01', completion: '0.03' },
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponseData), { status: 200 })
      );

      const result = await service.listModels();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('openai/gpt-4o');
    });

    it('should handle errors when listing models', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
          status: 401,
        })
      );

      await expect(service.listModels()).rejects.toThrow();
    });
  });

  describe('generateRecipeFromExisting', () => {
    it('should generate recipe from existing recipes', async () => {
      const mockResponseData = {
        id: 'chat-123',
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                title: 'Fusion Recipe',
                ingredients: [],
                instructions: [],
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponseData), { status: 200 })
      );

      const result = await service.generateRecipeFromExisting({
        existingRecipes: [
          { title: 'Recipe 1', content: 'Content 1' },
          { title: 'Recipe 2', content: 'Content 2' },
        ],
      });

      expect(result.id).toBe('chat-123');
      expect(typeof result.choices[0].message.content).toBe('object');
    });

    it('should generate recipe from preferences only', async () => {
      const mockResponseData = {
        id: 'chat-123',
        model: 'openai/gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                title: 'Vegan Recipe',
                ingredients: [],
                instructions: [],
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponseData), { status: 200 })
      );

      const result = await service.generateRecipeFromExisting({
        existingRecipes: [],
        customPrompt: 'User preferences: vegan, gluten-free',
      });

      expect(result.id).toBe('chat-123');
    });

    it('should throw error when no recipes or preferences provided', async () => {
      await expect(
        service.generateRecipeFromExisting({
          existingRecipes: [],
        })
      ).rejects.toThrow(
        'At least one existing recipe is required for generation, or provide dietary preferences'
      );
    });
  });
});
