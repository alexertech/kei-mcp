export interface ApprovalConfig {
  requireApproval: boolean;
  confirm?: (message: string) => Promise<boolean>;
}

export function approvalPrompt(action: string, resource: string, details: string): string {
  return `About to ${action} ${resource}.\n\n${details}`;
}

export async function requestApproval(config: ApprovalConfig | undefined, message: string) {
  if (!config?.requireApproval) return null;

  if (!config.confirm) {
    return deny('Approval is required but this client cannot ask the user (no elicitation support). Write not executed.');
  }
  if (!(await config.confirm(message))) {
    return deny('Write declined by user. Not executed.');
  }
  return null;
}

function deny(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
