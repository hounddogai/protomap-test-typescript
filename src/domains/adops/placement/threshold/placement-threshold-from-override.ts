import { placementBudgetBucket } from "../budget/placement-budget-policy.js";
import { PlacementOverride } from "../budget/placement-override.js";
import { PlacementThreshold, newPlacementThreshold } from "./placement-threshold.js";

export function summarizePlacementOverridesForThreshold(items: PlacementOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePlacementThresholdsFromOverride(items: PlacementOverride[]): PlacementThreshold[] {
  const out: PlacementThreshold[] = [];
  for (const item of items) {
    const derived = newPlacementThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computePlacementThreshold(item: PlacementThreshold): string {
  return placementBudgetBucket(item.projectedLoad());
}
