import { PendingApprovalAllocation } from "../../approval/profile/pending-approval-allocation.js";
import { normalizeRegionalApprovalSlotCode } from "../../approval/profile/regional-approval-slot-policy.js";
import { WeightedInsightOverride, newWeightedInsightOverride } from "./weighted-insight-override.js";

export function summarizePendingApprovalAllocationsForOverride(items: PendingApprovalAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWeightedInsightOverridesFromAllocation(items: PendingApprovalAllocation[]): WeightedInsightOverride[] {
  const out: WeightedInsightOverride[] = [];
  for (const item of items) {
    const derived = newWeightedInsightOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWeightedInsightOverride(item: WeightedInsightOverride): string {
  return normalizeRegionalApprovalSlotCode(item.code);
}
