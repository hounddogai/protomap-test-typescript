import { globalWindowReviewWeight } from "../../window/window-review/global-window-review-policy.js";
import { GlobalWindowReview } from "../../window/window-review/global-window-review.js";
import { PrimaryConversionCycle, newPrimaryConversionCycle } from "./primary-conversion-cycle.js";

export function summarizeGlobalWindowReviewsForCycle(items: GlobalWindowReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePrimaryConversionCyclesFromReview(items: GlobalWindowReview[]): PrimaryConversionCycle[] {
  const out: PrimaryConversionCycle[] = [];
  for (const item of items) {
    const derived = newPrimaryConversionCycle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitPrimaryConversionCycle(item: PrimaryConversionCycle): number {
  return globalWindowReviewWeight(3, true);
}
