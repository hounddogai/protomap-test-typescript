import { defaultPlacementMilestoneWeight } from "../../placement/review/default-placement-milestone-policy.js";
import { PlacementReview } from "../../placement/review/placement-review.js";
import { CappedFrequencyReview, newCappedFrequencyReview } from "./capped-frequency-review.js";

export function summarizePlacementReviewsForReview(items: PlacementReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveCappedFrequencyReviewsFromReview(items: PlacementReview[]): CappedFrequencyReview[] {
  const out: CappedFrequencyReview[] = [];
  for (const item of items) {
    const derived = newCappedFrequencyReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyCappedFrequencyReview(item: CappedFrequencyReview): number {
  return defaultPlacementMilestoneWeight(1, true);
}
