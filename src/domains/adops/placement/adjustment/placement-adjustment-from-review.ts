import { frequencyReviewBucket } from "../../frequency/slot/frequency-review-policy.js";
import { FrequencyReview } from "../../frequency/slot/frequency-review.js";
import { PlacementAdjustment, newPlacementAdjustment } from "./placement-adjustment.js";

export function summarizeFrequencyReviewsForAdjustment(items: FrequencyReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePlacementAdjustmentsFromReview(items: FrequencyReview[]): PlacementAdjustment[] {
  const out: PlacementAdjustment[] = [];
  for (const item of items) {
    const derived = newPlacementAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPlacementAdjustmentExtra(item: PlacementAdjustment): string {
  return frequencyReviewBucket(item.adjustedTotal());
}
