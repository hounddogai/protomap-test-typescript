import { PendingOptOutTier } from "../../opt-out/batch/pending-opt-out-tier.js";
import { normalizeRollingOptOutExceptionCode } from "../../opt-out/batch/rolling-opt-out-exception-policy.js";
import { RegionalSubscriptionReview, newRegionalSubscriptionReview } from "./regional-subscription-review.js";

export function summarizePendingOptOutTiersForReview(items: PendingOptOutTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRegionalSubscriptionReviewsFromTier(items: PendingOptOutTier[]): RegionalSubscriptionReview[] {
  const out: RegionalSubscriptionReview[] = [];
  for (const item of items) {
    const derived = newRegionalSubscriptionReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitRegionalSubscriptionReview(item: RegionalSubscriptionReview): string {
  return normalizeRollingOptOutExceptionCode(item.code);
}
