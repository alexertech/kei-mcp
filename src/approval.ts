export interface ApprovalConfig {
  requireApproval: boolean;
}

export function approvalPrompt(action: string, resource: string, details: string): string {
  return `About to ${action} ${resource}.\n\n${details}\n\nApprove? Reply "yes" to proceed or "no" to cancel.`;
}
