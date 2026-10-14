import { GlobalRewardRuleBundle } from "../../reward-rule/rule-bundle/global-reward-rule-bundle.js";
import { classifyRewardRuleAdjustment } from "../../reward-rule/rule-bundle/reward-rule-adjustment-policy.js";
import { PendingLeaderboardOverride, newPendingLeaderboardOverride } from "./pending-leaderboard-override.js";

export function summarizeGlobalRewardRuleBundlesForOverride(items: GlobalRewardRuleBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePendingLeaderboardOverridesFromBundle(items: GlobalRewardRuleBundle[]): PendingLeaderboardOverride[] {
  const out: PendingLeaderboardOverride[] = [];
  for (const item of items) {
    const derived = newPendingLeaderboardOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingLeaderboardOverride(item: PendingLeaderboardOverride): string {
  return classifyRewardRuleAdjustment(item.adjustedTotal());
}
