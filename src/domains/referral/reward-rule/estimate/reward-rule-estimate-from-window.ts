import { StrictLeaderboardWindow } from "../../leaderboard/leaderboard-plan/strict-leaderboard-window.js";
import {
  normalizeTieredLeaderboardPlanCode,
} from "../../leaderboard/leaderboard-plan/tiered-leaderboard-plan-policy.js";
import { RewardRuleEstimate, newRewardRuleEstimate } from "./reward-rule-estimate.js";

export function summarizeStrictLeaderboardWindowsForEstimate(items: StrictLeaderboardWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveRewardRuleEstimatesFromWindow(items: StrictLeaderboardWindow[]): RewardRuleEstimate[] {
  const out: RewardRuleEstimate[] = [];
  for (const item of items) {
    const derived = newRewardRuleEstimate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planRewardRuleEstimate(item: RewardRuleEstimate): string {
  return normalizeTieredLeaderboardPlanCode(item.code);
}
