import { performance } from 'node:perf_hooks';

export interface AuditEntry {
  tool: string;
  params: Record<string, unknown>;
  duration_ms: number;
  success: boolean;
  timestamp: string;
}

export async function withAudit<T extends { content: unknown[]; isError?: boolean }>(
  tool: string,
  params: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const entry: AuditEntry = {
    tool,
    params: sanitizeParams(params),
    duration_ms: Math.round(performance.now() - start),
    success: !result.isError,
    timestamp: new Date().toISOString(),
  };
  process.stderr.write(JSON.stringify(entry) + '\n');
  return result;
}

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const { approved: _, ...rest } = params;
  return rest;
}
