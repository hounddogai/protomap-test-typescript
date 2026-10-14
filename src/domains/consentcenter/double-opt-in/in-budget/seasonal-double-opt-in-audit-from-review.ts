import { StrictSubscriptionReview } from "../../subscription/audit/strict-subscription-review.js";
import { subscriptionAuditBucket } from "../../subscription/audit/subscription-audit-policy.js";
import { SeasonalDoubleOptInAudit, newSeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

export function summarizeStrictSubscriptionReviewsForAudit(items: StrictSubscriptionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSeasonalDoubleOptInAuditsFromReview(items: StrictSubscriptionReview[]): SeasonalDoubleOptInAudit[] {
  const out: SeasonalDoubleOptInAudit[] = [];
  for (const item of items) {
    const derived = newSeasonalDoubleOptInAudit(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeSeasonalDoubleOptInAudit(item: SeasonalDoubleOptInAudit): string {
  return subscriptionAuditBucket(item.netTotal());
}
