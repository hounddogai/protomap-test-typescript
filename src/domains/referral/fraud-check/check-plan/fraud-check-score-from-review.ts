import { inviteReviewBucket } from "../../invite/mapping/invite-review-policy.js";
import { InviteReview } from "../../invite/mapping/invite-review.js";
import { FraudCheckScore, newFraudCheckScore } from "./fraud-check-score.js";

export function summarizeInviteReviewsForScore(items: InviteReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFraudCheckScoresFromReview(items: InviteReview[]): FraudCheckScore[] {
  const out: FraudCheckScore[] = [];
  for (const item of items) {
    const derived = newFraudCheckScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeFraudCheckScore(item: FraudCheckScore): string {
  return inviteReviewBucket(item.projectedExposure());
}
