import { fallbackWarmupSummaryBucket } from "../../warmup/summary/fallback-warmup-summary-policy.js";
import { PendingWarmupAudit } from "../../warmup/summary/pending-warmup-audit.js";
import { BounceReview, newBounceReview } from "./bounce-review.js";

export function summarizePendingWarmupAuditsForReview(items: PendingWarmupAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveBounceReviewsFromAudit(items: PendingWarmupAudit[]): BounceReview[] {
  const out: BounceReview[] = [];
  for (const item of items) {
    const derived = newBounceReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleBounceReview(item: BounceReview): string {
  return fallbackWarmupSummaryBucket(item.weightedLoad());
}
