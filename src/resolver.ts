import type { ApiClient } from './api-client.js';
import { ApiError } from './api-client.js';

export interface ResolvedIds {
  column_id?: number;
  assignee_id?: number | null;
}

export class NameResolver {
  private columnsCache = new Map<string, Array<{ id: number; name: string }>>();
  private membersCache = new Map<string, Array<{ id: number; name: string }>>();

  constructor(private api: ApiClient) {}

  async resolveColumn(projectRef: string, name: string): Promise<number> {
    const columns = await this.getColumns(projectRef);
    const match = columns.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!match) throw new ApiError(422, `Column "${name}" not found in project ${projectRef}`);
    return match.id;
  }

  async resolveMember(projectRef: string, name: string): Promise<number | null> {
    if (name === 'me') {
      const userId = process.env.KEI_USER_ID;
      if (!userId) throw new ApiError(422, 'KEI_USER_ID not set; cannot resolve "me"');
      return Number(userId);
    }
    const members = await this.getMembers(projectRef);
    const match = members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (!match) throw new ApiError(422, `Member "${name}" not found in project ${projectRef}`);
    return match.id;
  }

  private async getColumns(projectRef: string) {
    if (!this.columnsCache.has(projectRef)) {
      const columns = await this.api.get<Array<{ id: number; name: string }>>(`/api/v1/projects/${projectRef}/columns`);
      this.columnsCache.set(projectRef, columns);
    }
    return this.columnsCache.get(projectRef)!;
  }

  private async getMembers(projectRef: string) {
    if (!this.membersCache.has(projectRef)) {
      const members = await this.api.get<Array<{ id: number; name: string }>>(`/api/v1/projects/${projectRef}/members`);
      this.membersCache.set(projectRef, members);
    }
    return this.membersCache.get(projectRef)!;
  }
}
