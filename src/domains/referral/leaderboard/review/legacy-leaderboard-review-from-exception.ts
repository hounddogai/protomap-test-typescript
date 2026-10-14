import { RewardRuleException } from "../../reward-rule/threshold/reward-rule-exception.js";
import { tieredRewardRuleEntryBucket } from "../../reward-rule/threshold/tiered-reward-rule-entry-policy.js";
import { LegacyLeaderboardReview, newLegacyLeaderboardReview } from "./legacy-leaderboard-review.js";

export function summarizeRewardRuleExceptionsForReview(items: RewardRuleException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyLeaderboardReviewsFromException(items: RewardRuleException[]): LegacyLeaderboardReview[] {
  const out: LegacyLeaderboardReview[] = [];
  for (const item of items) {
    const derived = newLegacyLeaderboardReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveLegacyLeaderboardReview(item: LegacyLeaderboardReview): string {
  return tieredRewardRuleEntryBucket(item.netVolume());
}
