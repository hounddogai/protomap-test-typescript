import { frequencyProfileBucket } from "../../frequency/review/frequency-profile-policy.js";
import { StrictFrequencyReview } from "../../frequency/review/strict-frequency-review.js";
import { PendingCreativeSegment, newPendingCreativeSegment } from "./pending-creative-segment.js";

export function summarizeStrictFrequencyReviewsForSegment(items: StrictFrequencyReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePendingCreativeSegmentsFromReview(items: StrictFrequencyReview[]): PendingCreativeSegment[] {
  const out: PendingCreativeSegment[] = [];
  for (const item of items) {
    const derived = newPendingCreativeSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingCreativeSegment(item: PendingCreativeSegment): string {
  return frequencyProfileBucket(item.weightedValue());
}
