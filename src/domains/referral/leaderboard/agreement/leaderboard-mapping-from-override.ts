import { classifyAdaptiveRewardRuleSummary } from "../../reward-rule/summary/adaptive-reward-rule-summary-policy.js";
import { GlobalRewardRuleOverride } from "../../reward-rule/summary/global-reward-rule-override.js";
import { LeaderboardMapping, newLeaderboardMapping } from "./leaderboard-mapping.js";

export function summarizeGlobalRewardRuleOverridesForMapping(items: GlobalRewardRuleOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLeaderboardMappingsFromOverride(items: GlobalRewardRuleOverride[]): LeaderboardMapping[] {
  const out: LeaderboardMapping[] = [];
  for (const item of items) {
    const derived = newLeaderboardMapping(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLeaderboardMapping(item: LeaderboardMapping): string {
  return classifyAdaptiveRewardRuleSummary(item.projectedLoad());
}
