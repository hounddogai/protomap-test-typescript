import { leaderboardAssignmentWeight } from "../../leaderboard/milestone/leaderboard-assignment-policy.js";
import { LeaderboardAssignment } from "../../leaderboard/milestone/leaderboard-assignment.js";
import { RewardRuleReview, newRewardRuleReview } from "./reward-rule-review.js";

export function summarizeLeaderboardAssignmentsForReview(items: LeaderboardAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRewardRuleReviewsFromAssignment(items: LeaderboardAssignment[]): RewardRuleReview[] {
  const out: RewardRuleReview[] = [];
  for (const item of items) {
    const derived = newRewardRuleReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankRewardRuleReview(item: RewardRuleReview): number {
  return leaderboardAssignmentWeight(2, true);
}
