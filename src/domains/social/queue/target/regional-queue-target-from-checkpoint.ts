import { ApprovalCheckpoint } from "../../approval/draft/approval-checkpoint.js";
import { approvalWindowWeight } from "../../approval/draft/approval-window-policy.js";
import { RegionalQueueTarget, newRegionalQueueTarget } from "./regional-queue-target.js";

export function summarizeApprovalCheckpointsForTarget(items: ApprovalCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRegionalQueueTargetsFromCheckpoint(items: ApprovalCheckpoint[]): RegionalQueueTarget[] {
  const out: RegionalQueueTarget[] = [];
  for (const item of items) {
    const derived = newRegionalQueueTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateRegionalQueueTarget(item: RegionalQueueTarget): number {
  return approvalWindowWeight(2, true);
}
