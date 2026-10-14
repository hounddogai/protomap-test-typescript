import { manualSlaReviewBucket } from "../../sla/sla-review/manual-sla-review-policy.js";
import { RollingSlaBaseline } from "../../sla/sla-review/rolling-sla-baseline.js";
import { BatchedDeflectionReview, newBatchedDeflectionReview } from "./batched-deflection-review.js";

export function summarizeRollingSlaBaselinesForReview(items: RollingSlaBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveBatchedDeflectionReviewsFromBaseline(items: RollingSlaBaseline[]): BatchedDeflectionReview[] {
  const out: BatchedDeflectionReview[] = [];
  for (const item of items) {
    const derived = newBatchedDeflectionReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateBatchedDeflectionReview(item: BatchedDeflectionReview): string {
  return manualSlaReviewBucket(item.projectedExposure());
}
