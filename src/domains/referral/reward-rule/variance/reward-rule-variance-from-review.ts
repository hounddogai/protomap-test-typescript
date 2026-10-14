import { inviteRequestBucket } from "../../invite/mapping/invite-request-policy.js";
import { InviteReview } from "../../invite/mapping/invite-review.js";
import { RewardRuleVariance, newRewardRuleVariance } from "./reward-rule-variance.js";

export function summarizeInviteReviewsForVariance(items: InviteReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveRewardRuleVariancesFromReview(items: InviteReview[]): RewardRuleVariance[] {
  const out: RewardRuleVariance[] = [];
  for (const item of items) {
    const derived = newRewardRuleVariance(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreRewardRuleVariance(item: RewardRuleVariance): string {
  return inviteRequestBucket(item.adjustedValue());
}
