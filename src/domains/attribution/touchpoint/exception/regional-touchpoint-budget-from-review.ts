import { WeightedWindowReview } from "../../window/global-window-notice/weighted-window-review.js";
import { windowAllocationBucket } from "../../window/global-window-notice/window-allocation-policy.js";
import { RegionalTouchpointBudget, newRegionalTouchpointBudget } from "./regional-touchpoint-budget.js";

export function summarizeWeightedWindowReviewsForBudget(items: WeightedWindowReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRegionalTouchpointBudgetsFromReview(items: WeightedWindowReview[]): RegionalTouchpointBudget[] {
  const out: RegionalTouchpointBudget[] = [];
  for (const item of items) {
    const derived = newRegionalTouchpointBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRegionalTouchpointBudget(item: RegionalTouchpointBudget): string {
  return windowAllocationBucket(item.weightedValue());
}
