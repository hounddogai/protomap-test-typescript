import {
  weightedRewardRulePreferenceBucket,
} from "../../reward-rule/tiered-rule-preference/weighted-reward-rule-preference-policy.js";
import {
  WeightedRewardRulePreference,
} from "../../reward-rule/tiered-rule-preference/weighted-reward-rule-preference.js";
import { LeaderboardCycle, newLeaderboardCycle } from "./leaderboard-cycle.js";

export function summarizeWeightedRewardRulePreferencesForCycle(items: WeightedRewardRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLeaderboardCyclesFromPreference(items: WeightedRewardRulePreference[]): LeaderboardCycle[] {
  const out: LeaderboardCycle[] = [];
  for (const item of items) {
    const derived = newLeaderboardCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLeaderboardCycle(item: LeaderboardCycle): string {
  return weightedRewardRulePreferenceBucket(item.projectedValue());
}
