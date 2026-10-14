import { batchedPlacementBudgetBucket } from "../../placement/checkpoint/batched-placement-budget-policy.js";
import { PlacementNotice } from "../../placement/checkpoint/placement-notice.js";
import { GlobalPacingAllocation, newGlobalPacingAllocation } from "./global-pacing-allocation.js";

export function summarizePlacementNoticesForAllocation(items: PlacementNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveGlobalPacingAllocationsFromNotice(items: PlacementNotice[]): GlobalPacingAllocation[] {
  const out: GlobalPacingAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalPacingAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyGlobalPacingAllocationExtra(item: GlobalPacingAllocation): string {
  return batchedPlacementBudgetBucket(item.weightedVolume());
}
