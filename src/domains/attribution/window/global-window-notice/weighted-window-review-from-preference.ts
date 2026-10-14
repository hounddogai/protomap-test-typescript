import { LenientPathPreference } from "../../path/threshold/lenient-path-preference.js";
import { tieredPathMappingBucket } from "../../path/threshold/tiered-path-mapping-policy.js";
import { WeightedWindowReview, newWeightedWindowReview } from "./weighted-window-review.js";

export function summarizeLenientPathPreferencesForReview(items: LenientPathPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedWindowReviewsFromPreference(items: LenientPathPreference[]): WeightedWindowReview[] {
  const out: WeightedWindowReview[] = [];
  for (const item of items) {
    const derived = newWeightedWindowReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWeightedWindowReview(item: WeightedWindowReview): string {
  return tieredPathMappingBucket(item.projectedTotal());
}
