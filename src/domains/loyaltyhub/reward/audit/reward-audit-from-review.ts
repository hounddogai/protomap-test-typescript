import { classifyCappedStreakReview } from "../../streak/review/capped-streak-review-policy.js";
import { CappedStreakReview } from "../../streak/review/capped-streak-review.js";
import { RewardAudit, newRewardAudit } from "./reward-audit.js";

export function summarizeCappedStreakReviewsForAudit(items: CappedStreakReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRewardAuditsFromReview(items: CappedStreakReview[]): RewardAudit[] {
  const out: RewardAudit[] = [];
  for (const item of items) {
    const derived = newRewardAudit(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateRewardAudit(item: RewardAudit): string {
  return classifyCappedStreakReview(item.measuredValue());
}
