import { PostSlot } from "../../post/slot/post-slot.js";
import { classifyPrimaryPostSnapshot } from "../../post/slot/primary-post-snapshot-policy.js";
import { PrimaryApprovalSummary, newPrimaryApprovalSummary } from "./primary-approval-summary.js";

export function summarizePostSlotsForSummary(items: PostSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePrimaryApprovalSummariesFromSlot(items: PostSlot[]): PrimaryApprovalSummary[] {
  const out: PrimaryApprovalSummary[] = [];
  for (const item of items) {
    const derived = newPrimaryApprovalSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computePrimaryApprovalSummary(item: PrimaryApprovalSummary): string {
  return classifyPrimaryPostSnapshot(item.netValue());
}
