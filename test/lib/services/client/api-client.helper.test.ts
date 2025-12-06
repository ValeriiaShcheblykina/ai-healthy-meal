import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchApi } from '@/lib/services/client/api-client.helper';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('api-client.helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchApi', () => {
    describe('Successful requests', () => {
      it('should make GET request successfully', async () => {
        const mockData = { id: '1', name: 'Test' };
        const mockResponse = new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<typeof mockData>(
          '/api/test',
          { method: 'GET' },
          { defaultMessage: 'Failed' }
        );

        expect(fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            credentials: 'include',
          })
        );
        expect(result).toEqual(mockData);
      });

      it('should make POST request with body', async () => {
        const requestBody = { name: 'Test', value: 123 };
        const mockData = { id: '1', ...requestBody };
        const mockResponse = new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<typeof mockData>(
          '/api/test',
          { method: 'POST', body: requestBody },
          { defaultMessage: 'Failed' }
        );

        expect(fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            credentials: 'include',
          })
        );
        expect(result).toEqual(mockData);
      });

      it('should handle 204 No Content response', async () => {
        const mockResponse = new Response(null, {
          status: 204,
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi(
          '/api/test',
          { method: 'DELETE' },
          { defaultMessage: 'Failed' }
        );

        expect(result).toBeUndefined();
      });

      it('should handle empty JSON response', async () => {
        const mockResponse = new Response('', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '0',
          },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<unknown>(
          '/api/test',
          { method: 'GET' },
          { defaultMessage: 'Failed' }
        );

        expect(result).toBeUndefined();
      });

      it('should handle response without content-type', async () => {
        const mockResponse = new Response('', {
          status: 200,
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<unknown>(
          '/api/test',
          { method: 'GET' },
          { defaultMessage: 'Failed' }
        );

        expect(result).toBeUndefined();
      });

      it('should handle invalid JSON in successful response', async () => {
        const mockResponse = new Response('invalid json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<unknown>(
          '/api/test',
          { method: 'GET' },
          { defaultMessage: 'Failed' }
        );

        expect(result).toBeUndefined();
      });

      it('should merge custom headers', async () => {
        const mockResponse = new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await fetchApi(
          '/api/test',
          {
            method: 'GET',
            headers: { 'X-Custom-Header': 'custom-value' },
          },
          { defaultMessage: 'Failed' }
        );

        expect(fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-Custom-Header': 'custom-value',
            }),
          })
        );
      });
    });

    describe('Error handling', () => {
      it('should handle 401 Unauthorized and redirect', async () => {
        const mockResponse = new Response(
          JSON.stringify({ error: { message: 'Unauthorized' } }),
          { status: 401 }
        );

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Authentication required');

        expect(mockLocation.href).toBe('/sign-in');
      });

      it('should handle 403 Forbidden and redirect', async () => {
        const mockResponse = new Response(
          JSON.stringify({ error: { message: 'Forbidden' } }),
          { status: 403 }
        );

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Authentication required');

        expect(mockLocation.href).toBe('/sign-in');
      });

      it('should handle 404 with custom notFoundMessage', async () => {
        const mockResponse = new Response(
          JSON.stringify({ error: { message: 'Not found' } }),
          { status: 404 }
        );

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi(
            '/api/test',
            { method: 'GET' },
            {
              defaultMessage: 'Failed',
              notFoundMessage: 'Resource not found',
            }
          )
        ).rejects.toThrow('Resource not found');
      });

      it('should handle 404 without custom notFoundMessage', async () => {
        const mockResponse = new Response(
          JSON.stringify({ error: { message: 'Not found' } }),
          { status: 404 }
        );

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Not found');
      });

      it('should extract error message from response body', async () => {
        const errorData = {
          error: { message: 'Custom error message', code: 'ERROR_CODE' },
        };
        const mockResponse = new Response(JSON.stringify(errorData), {
          status: 400,
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Custom error message');
      });

      it('should use statusText when error body is invalid JSON', async () => {
        const mockResponse = new Response('invalid json', {
          status: 400,
          statusText: 'Bad Request',
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Bad Request');
      });

      it('should use defaultMessage when error message is empty', async () => {
        const mockResponse = new Response(JSON.stringify({}), {
          status: 500,
          statusText: '',
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Failed');
      });

      it('should handle network errors', async () => {
        const networkError = new Error('Network error');
        vi.mocked(fetch).mockRejectedValue(networkError);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Network error');
      });

      it('should handle 500 Internal Server Error', async () => {
        const mockResponse = new Response(
          JSON.stringify({ error: { message: 'Internal server error' } }),
          { status: 500 }
        );

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await expect(
          fetchApi('/api/test', { method: 'GET' }, { defaultMessage: 'Failed' })
        ).rejects.toThrow('Internal server error');
      });
    });

    describe('Edge cases', () => {
      it('should handle null body', async () => {
        const mockResponse = new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await fetchApi(
          '/api/test',
          { method: 'GET', body: null },
          { defaultMessage: 'Failed' }
        );

        expect(fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            body: undefined,
          })
        );
      });

      it('should handle undefined body', async () => {
        const mockResponse = new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        await fetchApi(
          '/api/test',
          { method: 'GET', body: undefined },
          { defaultMessage: 'Failed' }
        );

        expect(fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            body: undefined,
          })
        );
      });

      it('should handle complex nested objects in body', async () => {
        const complexBody = {
          nested: {
            array: [1, 2, 3],
            object: { key: 'value' },
          },
        };
        const mockResponse = new Response(JSON.stringify(complexBody), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<typeof complexBody>(
          '/api/test',
          { method: 'POST', body: complexBody },
          { defaultMessage: 'Failed' }
        );

        expect(result).toEqual(complexBody);
      });

      it('should handle array responses', async () => {
        const arrayData = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const mockResponse = new Response(JSON.stringify(arrayData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const result = await fetchApi<typeof arrayData>(
          '/api/test',
          { method: 'GET' },
          { defaultMessage: 'Failed' }
        );

        expect(result).toEqual(arrayData);
      });
    });
  });
});
