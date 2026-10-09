# kei-mcp

MCP server for [Kei](https://kei.alexertech.com) project management. Allows AI agents (Claude Code, OpenCode, Cursor) to interact with your Kei projects.

## Installation

No installation needed! Just use `npx`:

```bash
npx -y kei-mcp --require-approval --api-key YOUR_API_KEY
```

Or set environment variables:

```bash
export KEI_API_KEY=your_api_key
export KEI_API_URL=http://localhost:3100  # optional, defaults to https://kei.alexertech.com
npx -y kei-mcp --require-approval
```

## Getting an API Key

1. Log in to Kei
2. Go to **Settings** (in the top nav)
3. Under **API Keys**, enter a name (e.g., "OpenCode") and click **Generate Key**
4. Copy the key from the modal — you won't see it again

## Configuration

### Claude Code

Add the MCP server:

```bash
claude mcp add kei -- npx -y kei-mcp --require-approval
```

Then configure the API key in your Claude Code settings:

```json
{
  "mcpServers": {
    "kei": {
      "command": "npx",
      "args": ["-y", "kei-mcp", "--require-approval"],
      "env": {
        "KEI_API_KEY": "your_api_key"
      }
    }
  }
}
```

### OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "kei": {
      "type": "local",
      "command": ["npx", "-y", "kei-mcp", "--require-approval"],
      "environment": {
        "KEI_API_KEY": "your_api_key"
      }
    }
  }
}
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kei": {
      "command": "npx",
      "args": ["-y", "kei-mcp", "--require-approval"],
      "env": {
        "KEI_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Available Tools

Once configured, your agent will have access to these tools:

- **list_projects** — List all your projects with task/bug counts
- **get_board** — Get a project's board with columns and work items
- **get_work_item** — Get detailed info about a specific work item
- **create_work_item** — Create a new task or bug
- **update_work_item** — Update title, description, priority, column, position, or assignee
- **add_activity** — Add a comment to a work item

## Security

### Tool Definition Hashes

SHA-256 hashes of the distributed JavaScript files are published below. You can verify these against your installed copy to detect tampering:

```
a83f3f9178d05bb05417de11683e5660f61043ae2a6b44cd79151babe2139e28  dist/api-client.js
6676a1352bb49cfb42b8004fdd7da2133739c6f3788d9d785328c77991850f58  dist/approval.js
8f4ee92ca1068009dd976b7c8a19b056c9f352207efe5ffc4caf73f3c48e0839  dist/audit.js
9bcee89ce2a5153fc84e2a8f746c79f38be9741cdbebafe83b6b1da2bc9c9e9f  dist/index.js
6b6d4ad6093f3c7488ae1fc0e970924a0013bd43c46af7e48fa1db9f5ad57cd9  dist/sanitize.js
d7ed6dbc0337895d635aac414aaebdc25e6bfe0809ebd3db9fbc14306922c9ce  dist/server.js
c3b171aa6f815921011354c1cb1f91ab536dcd41f62e96a72f9e0e1eef86c9bc  dist/tools.js
```

To verify your installed copy:

```bash
npx kei-mcp --version  # ensure installed
cd node_modules/kei-mcp
shasum -a 256 dist/*.js
```

### Approval Mode

Write operations (`create_work_item`, `update_work_item`, `add_activity`) support a `--require-approval` flag that requires explicit user confirmation before execution. Enable this in production environments.

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
