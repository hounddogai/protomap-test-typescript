import { BatchedPostMilestone } from "../../post/post-milestone/batched-post-milestone.js";
import { postSummaryBucket } from "../../post/post-milestone/post-summary-policy.js";
import { PendingApprovalMilestone, newPendingApprovalMilestone } from "./pending-approval-milestone.js";

export function summarizeBatchedPostMilestonesForMilestone(items: BatchedPostMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePendingApprovalMilestonesFromMilestone(items: BatchedPostMilestone[]): PendingApprovalMilestone[] {
  const out: PendingApprovalMilestone[] = [];
  for (const item of items) {
    const derived = newPendingApprovalMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPendingApprovalMilestone(item: PendingApprovalMilestone): string {
  return postSummaryBucket(item.adjustedValue());
}
