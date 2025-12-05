import { describe, it, expect } from 'vitest';
import { parseJsonBody } from '@/lib/api/parse-request-body';

describe('parseJsonBody', () => {
  describe('Valid JSON', () => {
    it('should parse valid JSON object', async () => {
      const json = { name: 'Test', value: 42 };
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });

    it('should parse valid JSON array', async () => {
      const json = [1, 2, 3, 'test'];
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });

    it('should parse valid JSON string', async () => {
      const json = 'simple string';
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toBe(json);
    });

    it('should parse valid JSON number', async () => {
      const json = 12345;
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toBe(json);
    });

    it('should parse valid JSON boolean', async () => {
      const json = true;
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toBe(json);
    });

    it('should parse valid JSON null', async () => {
      const json = null;
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toBeNull();
    });

    it('should parse complex nested JSON objects', async () => {
      const json = {
        user: {
          id: 1,
          name: 'John',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
          tags: ['admin', 'user'],
        },
        metadata: {
          created: '2024-01-01',
          updated: '2024-01-02',
        },
      };

      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });
  });

  describe('Invalid JSON', () => {
    it('should throw validation error for malformed JSON', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: '{"invalid": json}',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });

    it('should throw validation error for incomplete JSON', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: '{"incomplete":',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });

    it('should throw validation error for trailing comma', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: '{"key": "value",}',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });

    it('should throw validation error for unclosed string', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: '{"key": "unclosed string',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });

    it('should throw validation error with correct message', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      try {
        await parseJsonBody(request);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid JSON in request body');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('Empty body', () => {
    it('should handle empty body', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' },
      });

      // Empty body should throw validation error
      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });

    it('should handle body with only whitespace', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: '   ',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });
  });

  describe('Non-JSON content types', () => {
    it('should parse JSON even with text/plain content type', async () => {
      const json = { test: 'value' };
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'text/plain' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });

    it('should parse JSON even without content type header', async () => {
      const json = { test: 'value' };
      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });

    it('should throw error for non-JSON body with application/json header', async () => {
      const request = new Request('http://example.com', {
        method: 'POST',
        body: 'not json at all',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseJsonBody(request)).rejects.toThrow(
        'Invalid JSON in request body'
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle very large JSON objects', async () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
        })),
      };

      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(largeObject),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(largeObject);
      expect((result as typeof largeObject).data).toHaveLength(1000);
    });

    it('should handle JSON with special characters', async () => {
      const json = {
        message: 'Hello "world" with\nnewlines\tand\ttabs',
        unicode: '测试 🎉 émojis',
      };

      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });

    it('should handle JSON with escaped characters', async () => {
      const json = {
        escaped: 'String with "quotes" and \\backslashes\\',
      };

      const request = new Request('http://example.com', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody(request);

      expect(result).toEqual(json);
    });
  });
});
