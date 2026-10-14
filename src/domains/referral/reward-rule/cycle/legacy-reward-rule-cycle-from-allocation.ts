import { StrictLeaderboardAllocation } from "../../leaderboard/leaderboard-template/strict-leaderboard-allocation.js";
import {
  tieredLeaderboardTemplateWeight,
} from "../../leaderboard/leaderboard-template/tiered-leaderboard-template-policy.js";
import { LegacyRewardRuleCycle, newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

export function summarizeStrictLeaderboardAllocationsForCycle(items: StrictLeaderboardAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLegacyRewardRuleCyclesFromAllocation(items: StrictLeaderboardAllocation[]): LegacyRewardRuleCycle[] {
  const out: LegacyRewardRuleCycle[] = [];
  for (const item of items) {
    const derived = newLegacyRewardRuleCycle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreLegacyRewardRuleCycle(item: LegacyRewardRuleCycle): number {
  return tieredLeaderboardTemplateWeight(3, true);
}
