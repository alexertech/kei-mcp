import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiClient } from './api-client.js';
import { ApprovalConfig } from './approval.js';
import { withAudit } from './audit.js';
import {
  listProjects,
  getBoard,
  getWorkItem,
  createWorkItem,
  updateWorkItem,
  addActivity,
  listMembers,
  listColumns,
} from './tools.js';

export function createServer(api: ApiClient, approvalConfig?: ApprovalConfig): McpServer {
  const server = new McpServer({
    name: 'kei-mcp',
    version: '1.3.0',
  });

  server.registerTool(
    'list_projects',
    {
      description: 'List all projects the user has access to, with task/bug counts and member counts. Each project includes its numeric ID.',
      annotations: { readOnlyHint: true },
    },
    async () => withAudit('list_projects', {}, () => listProjects(api, {}))
  );

  server.registerTool(
    'get_board',
    {
      description: 'Get a project\'s board with all columns and work items. Accepts either project_id or project_key.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project_id, project_key }) => withAudit('get_board', { project_id, project_key }, () => getBoard(api, { project_id, project_key }))
  );

  server.registerTool(
    'get_work_item',
    {
      description: 'Get detailed information about a specific work item (task or bug) including description and recent activity. Accepts either numeric IDs or human-readable keys.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
        work_item_id: z.number().optional().describe('The work item ID (use either work_item_id or work_item_key)'),
        work_item_key: z.string().optional().describe('The work item identifier, e.g. "KEI-9" (use either work_item_id or work_item_key)'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project_id, project_key, work_item_id, work_item_key }) =>
      withAudit('get_work_item', { project_id, project_key, work_item_id, work_item_key }, () =>
        getWorkItem(api, { project_id, project_key, work_item_id, work_item_key })
      )
  );

  server.registerTool(
    'create_work_item',
    {
      description: 'Create a new task or bug in a project. Use list_columns first to get a valid column_id.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
        title: z.string().describe('The work item title'),
        type: z.enum(['Task', 'Bug']).optional().describe('The work item type'),
        priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional().describe('The priority level'),
        column_id: z.number().optional().describe('The column ID (use list_columns to find valid IDs)'),
        description: z.string().optional().describe('The work item description (optional)'),
        approved: z.boolean().optional().describe('Set to true to confirm execution when approval is required'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => withAudit('create_work_item', args, () => createWorkItem(api, args, approvalConfig))
  );

  server.registerTool(
    'update_work_item',
    {
      description: 'Update a work item\'s title, description, priority, column, position, or assignee. Accepts either numeric IDs or human-readable keys.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
        work_item_id: z.number().optional().describe('The work item ID (use either work_item_id or work_item_key)'),
        work_item_key: z.string().optional().describe('The work item identifier, e.g. "KEI-9" (use either work_item_id or work_item_key)'),
        title: z.string().optional().describe('New title (optional)'),
        description: z.string().optional().describe('New description (optional)'),
        priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional().describe('New priority (optional)'),
        column_id: z.number().optional().describe('Move to this column ID (optional)'),
        position: z.number().optional().describe('Position within the column (optional)'),
        assignee_id: z.number().optional().describe('Assign to this user ID (optional)'),
        approved: z.boolean().optional().describe('Set to true to confirm execution when approval is required'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => withAudit('update_work_item', args, () => updateWorkItem(api, args, approvalConfig))
  );

  server.registerTool(
    'add_activity',
    {
      description: 'Add a comment activity to a work item. Accepts either numeric IDs or human-readable keys.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
        work_item_id: z.number().optional().describe('The work item ID (use either work_item_id or work_item_key)'),
        work_item_key: z.string().optional().describe('The work item identifier, e.g. "KEI-9" (use either work_item_id or work_item_key)'),
        body: z.string().describe('The comment text'),
        approved: z.boolean().optional().describe('Set to true to confirm execution when approval is required'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => withAudit('add_activity', args, () => addActivity(api, args, approvalConfig))
  );

  server.registerTool(
    'list_members',
    {
      description: 'List all members of a project with their roles. Each member includes their numeric user ID.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => withAudit('list_members', args, () => listMembers(api, args))
  );

  server.registerTool(
    'list_columns',
    {
      description: 'List all columns of a project\'s board with their IDs, names, and positions. Use this to find valid column_id values for create_work_item.',
      inputSchema: {
        project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
        project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => withAudit('list_columns', args, () => listColumns(api, args))
  );

  return server;
}
