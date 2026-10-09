import type { ApiClient } from './api-client.js';
import { ApiError } from './api-client.js';
import type { ApprovalConfig } from './approval.js';
import { approvalPrompt } from './approval.js';
import { sanitize } from './sanitize.js';

function pathRef(ref: string | number | undefined): string {
  return encodeURIComponent(String(ref));
}

function errorResult(error: unknown) {
  if (error instanceof ApiError) {
    let errorType: string;
    if (error.statusCode === 404) {
      errorType = 'NOT_FOUND';
    } else if (error.statusCode === 429) {
      errorType = 'RATE_LIMITED';
    } else if (error.statusCode === 422) {
      errorType = 'VALIDATION_ERROR';
    } else if (error.statusCode === 0) {
      errorType = 'CONNECTION_ERROR';
    } else if (error.statusCode && error.statusCode >= 500) {
      errorType = 'SERVER_ERROR';
    } else {
      errorType = 'API_ERROR';
    }
    return {
      content: [{ type: 'text' as const, text: `Error [${errorType}]: ${error.message}` }],
      isError: true,
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: 'text' as const, text: `Error [UNKNOWN]: ${message}` }],
    isError: true,
  };
}

export interface ListProjectsArgs {}

export async function listProjects(api: ApiClient, _args: ListProjectsArgs) {
  try {
    const projects = await api.get<Array<Record<string, unknown>>>('/api/v1/projects');
    return {
      content: [{
        type: 'text' as const,
        text: projects.map((p) =>
          `- [${p.id as number}] ${sanitize(p.name as string)} (${p.key as string}): ${sanitize((p.description as string) || 'No description')} [${p.task_count as number} tasks, ${p.bug_count as number} bugs, ${p.member_count as number} members]`
        ).join('\n'),
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export interface GetBoardArgs {
  project_id?: number;
  project_key?: string;
}

export async function getBoard(api: ApiClient, args: GetBoardArgs) {
  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const board = await api.get<Record<string, unknown>>(`/api/v1/projects/${projectRef}/board`);
    const columns = (board.columns as Array<Record<string, unknown>>).map((col) => {
      const workItems = (col.work_items as Array<Record<string, unknown>>)
        .map((wi) => `  - [id:${wi.id as number}] [${wi.identifier as string}] ${sanitize(wi.title as string)} (${wi.priority as string})`)
        .join('\n');
      return `[id:${col.id as number}] ${sanitize(col.name as string)} (${(col.work_items as Array<unknown>).length} items):\n${workItems || '  (empty)'}`;
    }).join('\n\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Board: ${sanitize(board.name as string)}\n\n${columns}`,
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export interface GetWorkItemArgs {
  project_id?: number;
  project_key?: string;
  work_item_id?: number;
  work_item_key?: string;
}

export async function getWorkItem(api: ApiClient, args: GetWorkItemArgs) {
  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const workItemRef = pathRef(args.work_item_key || args.work_item_id);
    const wi = await api.get<Record<string, unknown>>(`/api/v1/projects/${projectRef}/work_items/${workItemRef}`);
    const activities = (wi.activities as Array<Record<string, unknown>> | undefined)
      ?.map((a) => {
        const user = a.user as Record<string, unknown>;
        return `[${a.created_at as string}] ${sanitize(user.name as string)}: ${a.action as string}${a.body ? ` - ${sanitize(a.body as string)}` : ''}`;
      })
      .join('\n') || 'No activities';

    const column = wi.column as Record<string, unknown>;
    const creator = wi.creator as Record<string, unknown>;
    const assignee = wi.assignee as Record<string, unknown> | null;

    const text = [
      `[id:${wi.id as number}] ${wi.identifier as string}: ${sanitize(wi.title as string)}`,
      `Type: ${wi.type as string} | Priority: ${wi.priority as string} | Column: ${sanitize(column.name as string)} [id:${column.id as number}]`,
      `Creator: ${sanitize(creator.name as string)} | Assignee: ${assignee ? sanitize(assignee.name as string) : 'Unassigned'}`,
      '',
      'Description:',
      sanitize((wi.description as string) || '(none)'),
      '',
      'Recent Activity:',
      activities,
    ].join('\n');

    return { content: [{ type: 'text' as const, text }] };
  } catch (error) {
    return errorResult(error);
  }
}

export interface CreateWorkItemArgs {
  project_id?: number;
  project_key?: string;
  title: string;
  type?: 'Task' | 'Bug';
  priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  column_id?: number;
  description?: string;
  approved?: boolean;
}

export async function createWorkItem(api: ApiClient, args: CreateWorkItemArgs, approvalConfig?: ApprovalConfig) {
  if (approvalConfig?.requireApproval && !args.approved) {
    const details = [
      `Project: ${args.project_key || args.project_id}`,
      `Title: ${args.title}`,
      `Type: ${args.type ?? 'Task'}`,
      `Priority: ${args.priority ?? 'none'}`,
      ...(args.column_id != null ? [`Column ID: ${args.column_id}`] : []),
      ...(args.description != null ? [`Description: ${args.description}`] : []),
    ].join('\n');
    return { content: [{ type: 'text' as const, text: approvalPrompt('create', 'work item', details) }] };
  }

  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const body: Record<string, unknown> = {
      work_item: {
        title: args.title,
        type: args.type ?? 'Task',
        priority: args.priority ?? 'none',
        ...(args.column_id != null && { column_id: args.column_id }),
        ...(args.description != null && { description: args.description }),
      },
    };

    const wi = await api.post<Record<string, unknown>>(`/api/v1/projects/${projectRef}/work_items`, body);
    return {
      content: [{
        type: 'text' as const,
        text: `Created [id:${wi.id as number}] ${wi.identifier as string}: ${sanitize(wi.title as string)} (${wi.type as string}, ${wi.priority as string} priority)`,
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export interface UpdateWorkItemArgs {
  project_id?: number;
  project_key?: string;
  work_item_id?: number;
  work_item_key?: string;
  title?: string;
  description?: string;
  priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  column_id?: number;
  position?: number;
  assignee_id?: number | null;
  approved?: boolean;
}

export async function updateWorkItem(api: ApiClient, args: UpdateWorkItemArgs, approvalConfig?: ApprovalConfig) {
  if (approvalConfig?.requireApproval && !args.approved) {
    const changes = [
      ...(args.title != null ? [`Title: ${args.title}`] : []),
      ...(args.description != null ? [`Description: ${args.description}`] : []),
      ...(args.priority != null ? [`Priority: ${args.priority}`] : []),
      ...(args.column_id != null ? [`Column ID: ${args.column_id}`] : []),
      ...(args.position != null ? [`Position: ${args.position}`] : []),
      ...(args.assignee_id !== undefined ? [`Assignee ID: ${args.assignee_id ?? 'none (unassign)'}`] : []),
    ].join('\n');
    const details = `Work item: ${args.work_item_key || args.work_item_id}\n${changes}`;
    return { content: [{ type: 'text' as const, text: approvalPrompt('update', 'work item', details) }] };
  }

  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const workItemRef = pathRef(args.work_item_key || args.work_item_id);
    const workItem: Record<string, unknown> = {};
    if (args.title != null) workItem.title = args.title;
    if (args.description != null) workItem.description = args.description;
    if (args.priority != null) workItem.priority = args.priority;
    if (args.column_id != null) workItem.column_id = args.column_id;
    if (args.position != null) workItem.position = args.position;
    if (args.assignee_id !== undefined) workItem.assignee_id = args.assignee_id;

    const wi = await api.patch<Record<string, unknown>>(
      `/api/v1/projects/${projectRef}/work_items/${workItemRef}`,
      { work_item: workItem }
    );
    return {
      content: [{
        type: 'text' as const,
        text: `Updated [id:${wi.id as number}] ${wi.identifier as string}: ${sanitize(wi.title as string)} (${wi.type as string}, ${wi.priority as string} priority)`,
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export interface AddActivityArgs {
  project_id?: number;
  project_key?: string;
  work_item_id?: number;
  work_item_key?: string;
  body: string;
  approved?: boolean;
}

export async function addActivity(api: ApiClient, args: AddActivityArgs, approvalConfig?: ApprovalConfig) {
  if (approvalConfig?.requireApproval && !args.approved) {
    const details = `Work item: ${args.work_item_key || args.work_item_id}\nComment: ${args.body}`;
    return { content: [{ type: 'text' as const, text: approvalPrompt('add comment to', 'work item', details) }] };
  }

  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const workItemRef = pathRef(args.work_item_key || args.work_item_id);
    const activity = await api.post<Record<string, unknown>>(
      `/api/v1/projects/${projectRef}/work_items/${workItemRef}/activities`,
      { work_item_activity: { body: args.body } }
    );
    return {
      content: [{
        type: 'text' as const,
        text: `Added comment to work item: ${sanitize(activity.body as string)}`,
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export interface ListMembersArgs {
  project_id?: number;
  project_key?: string;
}

export async function listMembers(api: ApiClient, args: ListMembersArgs) {
  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const members = await api.get<Array<Record<string, unknown>>>(`/api/v1/projects/${projectRef}/members`);
    return {
      content: [{
        type: 'text' as const,
        text: members.map((m) =>
          `- [id:${m.id as number}] ${sanitize(m.name as string)} [${m.role as string}]`
        ).join('\n'),
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}

export interface ListColumnsArgs {
  project_id?: number;
  project_key?: string;
}

export async function listColumns(api: ApiClient, args: ListColumnsArgs) {
  try {
    const projectRef = pathRef(args.project_key || args.project_id);
    const columns = await api.get<Array<Record<string, unknown>>>(`/api/v1/projects/${projectRef}/columns`);
    return {
      content: [{
        type: 'text' as const,
        text: columns.map((col) =>
          `- [id:${col.id as number}] ${sanitize(col.name as string)} (position: ${col.position as number})`
        ).join('\n'),
      }],
    };
  } catch (error) {
    return errorResult(error);
  }
}
