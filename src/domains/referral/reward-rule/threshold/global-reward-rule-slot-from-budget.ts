import { LeaderboardBudget } from "../../leaderboard/policy/leaderboard-budget.js";
import { leaderboardBundleWeight } from "../../leaderboard/policy/leaderboard-bundle-policy.js";
import { GlobalRewardRuleSlot, newGlobalRewardRuleSlot } from "./global-reward-rule-slot.js";

export function summarizeLeaderboardBudgetsForSlot(items: LeaderboardBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalRewardRuleSlotsFromBudget(items: LeaderboardBudget[]): GlobalRewardRuleSlot[] {
  const out: GlobalRewardRuleSlot[] = [];
  for (const item of items) {
    const derived = newGlobalRewardRuleSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileGlobalRewardRuleSlot(item: GlobalRewardRuleSlot): number {
  return leaderboardBundleWeight(3, true);
}
