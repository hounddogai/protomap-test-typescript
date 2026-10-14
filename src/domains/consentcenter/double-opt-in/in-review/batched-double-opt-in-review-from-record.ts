import { GlobalSuppressionRecord } from "../../suppression/segment/global-suppression-record.js";
import { tieredSuppressionSegmentBucket } from "../../suppression/segment/tiered-suppression-segment-policy.js";
import { BatchedDoubleOptInReview, newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

export function summarizeGlobalSuppressionRecordsForReview(items: GlobalSuppressionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBatchedDoubleOptInReviewsFromRecord(items: GlobalSuppressionRecord[]): BatchedDoubleOptInReview[] {
  const out: BatchedDoubleOptInReview[] = [];
  for (const item of items) {
    const derived = newBatchedDoubleOptInReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedDoubleOptInReview(item: BatchedDoubleOptInReview): string {
  return tieredSuppressionSegmentBucket(item.effectiveExposure());
}
