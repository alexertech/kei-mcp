#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './api-client.js';
import { createServer } from './server.js';
import type { ApprovalConfig } from './approval.js';

function parseArgs(argv: string[]): { apiUrl: string; apiKey: string; requireApproval: boolean } {
  const args = argv.slice(2);
  let apiUrl = process.env.KEI_API_URL || 'https://kei.alexertech.com';
  let apiKey = process.env.KEI_API_KEY || '';
  let requireApproval = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-url' && args[i + 1]) {
      apiUrl = args[i + 1];
      i++;
    } else if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--require-approval') {
      requireApproval = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: kei-mcp [options]

Options:
  --api-url URL         Kei API base URL (default: https://kei.alexertech.com, or KEI_API_URL env)
  --api-key KEY         Kei API key (or KEI_API_KEY env)
  --require-approval    Require user confirmation before executing write operations
  -h, --help            Show this help`);
      process.exit(0);
    }
  }

  return { apiUrl, apiKey, requireApproval };
}

async function main() {
  const { apiUrl, apiKey, requireApproval } = parseArgs(process.argv);

  if (!apiKey) {
    console.error('Error: API key required. Use --api-key or set KEI_API_KEY environment variable.');
    process.exit(1);
  }

  const api = new ApiClient({ baseUrl: apiUrl, apiKey });
  const approvalConfig: ApprovalConfig = { requireApproval };
  const server = createServer(api, approvalConfig);
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
