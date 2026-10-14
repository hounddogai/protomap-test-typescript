import { regionalChallengeReviewBucket } from "../../challenge/forecast/regional-challenge-review-policy.js";
import { RegionalChallengeReview } from "../../challenge/forecast/regional-challenge-review.js";
import { PendingBadgeAudit, newPendingBadgeAudit } from "./pending-badge-audit.js";

export function summarizeRegionalChallengeReviewsForAudit(items: RegionalChallengeReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePendingBadgeAuditsFromReview(items: RegionalChallengeReview[]): PendingBadgeAudit[] {
  const out: PendingBadgeAudit[] = [];
  for (const item of items) {
    const derived = newPendingBadgeAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planPendingBadgeAudit(item: PendingBadgeAudit): string {
  return regionalChallengeReviewBucket(item.adjustedLoad());
}
