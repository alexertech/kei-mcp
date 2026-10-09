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

  server.tool(
    'list_projects',
    'List all projects the user has access to, with task/bug counts and member counts. Each project includes its numeric ID.',
    async () => withAudit('list_projects', {}, () => listProjects(api, {}))
  );

  server.tool(
    'get_board',
    'Get a project\'s board with all columns and work items. Accepts either project_id or project_key.',
    {
      project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
      project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
    },
    async ({ project_id, project_key }) => withAudit('get_board', { project_id, project_key }, () => getBoard(api, { project_id, project_key }))
  );

  server.tool(
    'get_work_item',
    'Get detailed information about a specific work item (task or bug) including description and recent activity. Accepts either numeric IDs or human-readable keys.',
    {
      project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
      project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
      work_item_id: z.number().optional().describe('The work item ID (use either work_item_id or work_item_key)'),
      work_item_key: z.string().optional().describe('The work item identifier, e.g. "KEI-9" (use either work_item_id or work_item_key)'),
    },
    async ({ project_id, project_key, work_item_id, work_item_key }) =>
      withAudit('get_work_item', { project_id, project_key, work_item_id, work_item_key }, () =>
        getWorkItem(api, { project_id, project_key, work_item_id, work_item_key })
      )
  );

  server.tool(
    'create_work_item',
    'Create a new task or bug in a project. Use list_columns first to get a valid column_id.',
    {
      project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
      project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
      title: z.string().describe('The work item title'),
      type: z.enum(['Task', 'Bug']).optional().describe('The work item type'),
      priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional().describe('The priority level'),
      column_id: z.number().optional().describe('The column ID (use list_columns to find valid IDs)'),
      description: z.string().optional().describe('The work item description (optional)'),
      approved: z.boolean().optional().describe('Set to true to confirm execution when approval is required'),
    },
    async (args) => withAudit('create_work_item', args, () => createWorkItem(api, args, approvalConfig))
  );

  server.tool(
    'update_work_item',
    'Update a work item\'s title, description, priority, column, position, or assignee. Accepts either numeric IDs or human-readable keys.',
    {
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
    async (args) => withAudit('update_work_item', args, () => updateWorkItem(api, args, approvalConfig))
  );

  server.tool(
    'add_activity',
    'Add a comment activity to a work item. Accepts either numeric IDs or human-readable keys.',
    {
      project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
      project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
      work_item_id: z.number().optional().describe('The work item ID (use either work_item_id or work_item_key)'),
      work_item_key: z.string().optional().describe('The work item identifier, e.g. "KEI-9" (use either work_item_id or work_item_key)'),
      body: z.string().describe('The comment text'),
      approved: z.boolean().optional().describe('Set to true to confirm execution when approval is required'),
    },
    async (args) => withAudit('add_activity', args, () => addActivity(api, args, approvalConfig))
  );

  server.tool(
    'list_members',
    'List all members of a project with their roles. Each member includes their numeric user ID.',
    {
      project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
      project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
    },
    async (args) => withAudit('list_members', args, () => listMembers(api, args))
  );

  server.tool(
    'list_columns',
    'List all columns of a project\'s board with their IDs, names, and positions. Use this to find valid column_id values for create_work_item.',
    {
      project_id: z.number().optional().describe('The project ID (use either project_id or project_key)'),
      project_key: z.string().optional().describe('The project key, e.g. "KEI" (use either project_id or project_key)'),
    },
    async (args) => withAudit('list_columns', args, () => listColumns(api, args))
  );

  return server;
}
