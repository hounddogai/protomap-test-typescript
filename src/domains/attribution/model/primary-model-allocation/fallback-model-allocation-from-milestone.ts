import { TieredWindowMilestone } from "../../window/budget/tiered-window-milestone.js";
import { windowBudgetWeight } from "../../window/budget/window-budget-policy.js";
import { FallbackModelAllocation, newFallbackModelAllocation } from "./fallback-model-allocation.js";

export function summarizeTieredWindowMilestonesForAllocation(items: TieredWindowMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveFallbackModelAllocationsFromMilestone(items: TieredWindowMilestone[]): FallbackModelAllocation[] {
  const out: FallbackModelAllocation[] = [];
  for (const item of items) {
    const derived = newFallbackModelAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyFallbackModelAllocation(item: FallbackModelAllocation): number {
  return windowBudgetWeight(9, true);
}
