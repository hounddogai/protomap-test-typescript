import { approvalCheckpointBucket } from "../../approval/draft/approval-checkpoint-policy.js";
import { ApprovalWindow } from "../../approval/draft/approval-window.js";
import { BatchedPostTemplate, newBatchedPostTemplate } from "./batched-post-template.js";

export function summarizeApprovalWindowsForTemplate(items: ApprovalWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBatchedPostTemplatesFromWindow(items: ApprovalWindow[]): BatchedPostTemplate[] {
  const out: BatchedPostTemplate[] = [];
  for (const item of items) {
    const derived = newBatchedPostTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planBatchedPostTemplate(item: BatchedPostTemplate): string {
  return approvalCheckpointBucket(item.projectedLoad());
}
