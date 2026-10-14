import { normalizeLeaderboardPlanCode } from "../../leaderboard/plan/leaderboard-plan-policy.js";
import { LeaderboardPlan } from "../../leaderboard/plan/leaderboard-plan.js";
import { RewardRuleMilestone, newRewardRuleMilestone } from "./reward-rule-milestone.js";

export function summarizeLeaderboardPlansForMilestone(items: LeaderboardPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRewardRuleMilestonesFromPlan(items: LeaderboardPlan[]): RewardRuleMilestone[] {
  const out: RewardRuleMilestone[] = [];
  for (const item of items) {
    const derived = newRewardRuleMilestone(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleRewardRuleMilestone(item: RewardRuleMilestone): string {
  return normalizeLeaderboardPlanCode(item.code);
}
