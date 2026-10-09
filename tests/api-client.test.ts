import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiError } from '../src/api-client.js';

describe('ApiClient', () => {
  let client: ApiClient;
  const baseUrl = 'http://localhost:3100';
  const apiKey = 'test-key';

  beforeEach(() => {
    client = new ApiClient({ baseUrl, apiKey });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('makes GET request with auth header', async () => {
      const mockResponse = [{ id: 1, name: 'Test' }];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.get('/api/v1/projects');
      expect(result).toEqual(mockResponse);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3100/api/v1/projects',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );
    });

    it('includes query params', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await client.get('/api/v1/projects', { foo: 'bar' });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3100/api/v1/projects?foo=bar',
        expect.any(Object)
      );
    });
  });

  describe('post', () => {
    it('makes POST request with JSON body', async () => {
      const mockResponse = { id: 1, title: 'Test' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await client.post('/api/v1/projects/1/work_items', { work_item: { title: 'Test' } });
      expect(result).toEqual(mockResponse);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3100/api/v1/projects/1/work_items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ work_item: { title: 'Test' } }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('patch', () => {
    it('makes PATCH request with JSON body', async () => {
      const mockResponse = { id: 1, title: 'Updated' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.patch('/api/v1/projects/1/work_items/1', { work_item: { title: 'Updated' } });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('makes DELETE request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => undefined,
      } as unknown as Response);

      const result = await client.delete('/api/v1/projects/1/work_items/1');
      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('raises ApiError on 401', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(client.get('/api/v1/projects')).rejects.toThrow(ApiError);
    });

    it('raises ApiError with retry hint on 429', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '30' }),
      } as Response);

      await expect(client.get('/api/v1/projects')).rejects.toThrow('Rate limited: retry after 30s');
    });

    it('raises ApiError on 403', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      await expect(client.get('/api/v1/projects')).rejects.toThrow(/Forbidden/);
    });

    it('raises ApiError on 404', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(client.get('/api/v1/projects/999')).rejects.toThrow(/Not found/);
    });

    it('raises ApiError on 422 with validation errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ errors: { title: ["can't be blank"] } }),
      } as Response);

      await expect(client.post('/api/v1/projects/1/work_items', {})).rejects.toThrow(/Validation failed/);
    });

    it('raises ApiError on connection refused', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(client.get('/api/v1/projects')).rejects.toThrow(/Cannot connect/);
    });

    it('raises ApiError on timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.mocked(fetch).mockRejectedValueOnce(abortError);

      await expect(client.get('/api/v1/projects')).rejects.toThrow(/Request timeout/);
    });
  });
});
