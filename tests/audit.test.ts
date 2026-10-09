import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withAudit } from '../src/audit.js';

describe('withAudit', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('logs a JSON entry to stdout', async () => {
    const result = await withAudit('test_tool', { foo: 'bar' }, async () => ({
      content: [{ type: 'text' as const, text: 'ok' }],
    }));

    expect(result.content[0].text).toBe('ok');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);

    const logged = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(logged.tool).toBe('test_tool');
    expect(logged.params).toEqual({ foo: 'bar' });
    expect(logged.success).toBe(true);
    expect(logged.duration_ms).toBeTypeOf('number');
    expect(logged.timestamp).toBeTypeOf('string');
  });

  it('reports success=false when result has isError', async () => {
    await withAudit('failing_tool', {}, async () => ({
      content: [{ type: 'text' as const, text: 'error' }],
      isError: true,
    }));

    const logged = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(logged.success).toBe(false);
  });

  it('strips approved param from logged params', async () => {
    await withAudit('write_tool', { title: 'Test', approved: true }, async () => ({
      content: [{ type: 'text' as const, text: 'ok' }],
    }));

    const logged = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(logged.params).toEqual({ title: 'Test' });
    expect(logged.params.approved).toBeUndefined();
  });
});
