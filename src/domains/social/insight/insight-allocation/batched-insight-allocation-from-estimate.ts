import { rollingApprovalEstimateWeight } from "../../approval/preference/rolling-approval-estimate-policy.js";
import { RollingApprovalEstimate } from "../../approval/preference/rolling-approval-estimate.js";
import { BatchedInsightAllocation, newBatchedInsightAllocation } from "./batched-insight-allocation.js";

export function summarizeRollingApprovalEstimatesForAllocation(items: RollingApprovalEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBatchedInsightAllocationsFromEstimate(items: RollingApprovalEstimate[]): BatchedInsightAllocation[] {
  const out: BatchedInsightAllocation[] = [];
  for (const item of items) {
    const derived = newBatchedInsightAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeBatchedInsightAllocation(item: BatchedInsightAllocation): number {
  return rollingApprovalEstimateWeight(2, true);
}
