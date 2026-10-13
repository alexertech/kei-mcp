import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../src/api-client.js';
import { NameResolver } from '../src/resolver.js';

describe('NameResolver', () => {
  let api: ApiClient;
  let resolver: NameResolver;

  beforeEach(() => {
    api = new ApiClient({ baseUrl: 'http://localhost:3100', apiKey: 'test-key' });
    resolver = new NameResolver(api);
  });

  afterEach(() => {
    delete process.env.KEI_USER_ID;
  });

  describe('resolveColumn', () => {
    it('resolves column name to id case-insensitively', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce([
        { id: 1, name: 'Backlog' },
        { id: 2, name: 'To Do' },
        { id: 3, name: 'In Progress' },
      ]);

      const id = await resolver.resolveColumn('PA', 'to do');
      expect(id).toBe(2);
    });

    it('throws 422 when column not found', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce([
        { id: 1, name: 'Backlog' },
      ]);

      await expect(resolver.resolveColumn('PA', 'Missing')).rejects.toThrow('Column "Missing" not found');
    });

    it('caches columns on second call', async () => {
      const get = vi.spyOn(api, 'get').mockResolvedValue([{ id: 1, name: 'Backlog' }]);

      await resolver.resolveColumn('PA', 'Backlog');
      await resolver.resolveColumn('PA', 'Backlog');

      expect(get).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolveMember', () => {
    it('resolves member name to id', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);

      const id = await resolver.resolveMember('PA', 'alice');
      expect(id).toBe(1);
    });

    it('resolves "me" using KEI_USER_ID env var', async () => {
      process.env.KEI_USER_ID = '42';

      const id = await resolver.resolveMember('PA', 'me');
      expect(id).toBe(42);
    });

    it('throws 422 for "me" when KEI_USER_ID is not set', async () => {
      await expect(resolver.resolveMember('PA', 'me')).rejects.toThrow('KEI_USER_ID not set');
    });

    it('throws 422 when member not found', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce([{ id: 1, name: 'Alice' }]);

      await expect(resolver.resolveMember('PA', 'Missing')).rejects.toThrow('Member "Missing" not found');
    });

    it('caches members on second call', async () => {
      const get = vi.spyOn(api, 'get').mockResolvedValue([{ id: 1, name: 'Alice' }]);

      await resolver.resolveMember('PA', 'Alice');
      await resolver.resolveMember('PA', 'Alice');

      expect(get).toHaveBeenCalledTimes(1);
    });
  });
});
