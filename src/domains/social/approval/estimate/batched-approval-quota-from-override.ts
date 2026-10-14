import { classifyLenientApprovalCheckpoint } from "../override-item/lenient-approval-checkpoint-policy.js";
import { RegionalApprovalOverride } from "../override-item/regional-approval-override.js";
import { BatchedApprovalQuota, newBatchedApprovalQuota } from "./batched-approval-quota.js";

export function summarizeRegionalApprovalOverridesForQuota(items: RegionalApprovalOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBatchedApprovalQuotasFromOverride(items: RegionalApprovalOverride[]): BatchedApprovalQuota[] {
  const out: BatchedApprovalQuota[] = [];
  for (const item of items) {
    const derived = newBatchedApprovalQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedApprovalQuota(item: BatchedApprovalQuota): string {
  return classifyLenientApprovalCheckpoint(item.measuredValue());
}
