import {
  pendingActivationReviewBucket,
} from "../../activation/global-activation-review/pending-activation-review-policy.js";
import { PendingActivationReview } from "../../activation/global-activation-review/pending-activation-review.js";
import { WeightedRetentionSlot, newWeightedRetentionSlot } from "./weighted-retention-slot.js";

export function summarizePendingActivationReviewsForSlot(items: PendingActivationReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWeightedRetentionSlotsFromReview(items: PendingActivationReview[]): WeightedRetentionSlot[] {
  const out: WeightedRetentionSlot[] = [];
  for (const item of items) {
    const derived = newWeightedRetentionSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedRetentionSlot(item: WeightedRetentionSlot): string {
  return pendingActivationReviewBucket(item.effectiveTotal());
}
