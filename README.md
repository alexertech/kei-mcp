<p align="center">
  <a href="https://www.getkei.com">
    <img src="https://raw.githubusercontent.com/alexertech/kei-mcp/main/assets/kei_logo.png" alt="Kei" height="120">
  </a>
</p>

<h1 align="center">kei-mcp</h1>

<p align="center">
  MCP server for <a href="https://www.getkei.com">Kei</a>, a KISS project management tool.<br>
  Tasks, Bugs, Kanban boards - nothing else.
</p>

<p align="center">
  <a href="https://www.getkei.com"><strong>www.getkei.com</strong></a>
</p>

---

Lets AI agents (Claude Code, OpenCode, Cursor) read your Kei boards, create and update work items, and comment on them.

## Install

### Claude Code (recommended)

```bash
claude plugin marketplace add alexertech/kei-mcp
claude plugin install kei-mcp@kei
```

Claude Code prompts for your API key and stores it in secure storage.

### Any MCP client (npx)

No installation needed:

```bash
export KEI_API_KEY=your_api_key
export KEI_API_URL=http://localhost:3100  # optional, defaults to https://kei.alexertech.com
npx -y kei-mcp --require-approval
```

`--api-key` also works, but the key then shows up in the process list.

## Getting an API Key

1. Log in to Kei
2. Go to **Settings** (in the top nav)
3. Under **API Keys**, enter a name (e.g., "OpenCode") and click **Generate Key**
4. Copy the key from the modal — you won't see it again

Keys expire after 90 days.

## Manual configuration

### Claude Code

```bash
claude mcp add kei -e KEI_API_KEY=your_api_key -- npx -y kei-mcp --require-approval
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

- **list_projects** — List all your projects with task/bug counts
- **get_board** — Get a project's board with columns and work items
- **get_work_item** — Get detailed info about a specific work item
- **create_work_item** — Create a new task or bug
- **update_work_item** — Update title, description, priority, column, position, or assignee (`null` unassigns)
- **add_activity** — Add a comment to a work item
- **list_members** — List project members and their user IDs
- **list_columns** — List board columns and their IDs

Read tools are annotated `readOnlyHint`; write tools are non-destructive. Audit logs go to stderr, never stdout.

## Security

### Approval Mode

Write operations (`create_work_item`, `update_work_item`, `add_activity`) support a `--require-approval` flag that asks you for confirmation (MCP elicitation) before execution. The agent cannot approve on its own. If your client doesn't support elicitation, writes are refused.

## Development

```bash
npm install
npm run build
npm test
```

## License

[MIT](LICENSE) © Alex Barrios
