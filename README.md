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

### Claude Code plugin marketplace

```bash
claude plugin marketplace add alexertech/kei_app_mcp
claude plugin install kei-mcp@kei
```

Claude Code prompts for your API key and stores it securely.

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

OpenCode prefixes tool names with the server name (`kei_list_projects`, ...). Control them with globs:

```json
{ "tools": { "kei_*": false }, "agent": { "my-agent": { "tools": { "kei_*": true } } } }
```

Check the connection with `opencode mcp list`.

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
- **list_members** — List project members and their user IDs
- **list_columns** — List board columns and their IDs

Read tools are annotated `readOnlyHint`; write tools are non-destructive. Audit logs go to stderr, never stdout.

## Security

### Tool Definition Hashes

Release hashes of the distributed JavaScript files are generated at publish time with `npm run hashes`. Compare them against your installed copy:

```bash
cd node_modules/kei-mcp
shasum -a 256 dist/*.js
```

### Approval Mode

Write operations (`create_work_item`, `update_work_item`, `add_activity`) support a `--require-approval` flag that asks for confirmation before execution. This is advisory: the agent supplies the `approved` flag itself. For a hard guard, use your harness's own tool permissions.

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
