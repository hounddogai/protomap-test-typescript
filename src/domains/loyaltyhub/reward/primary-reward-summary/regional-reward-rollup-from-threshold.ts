import { badgeCycleBucket } from "../../badge/cycle/badge-cycle-policy.js";
import { FallbackBadgeThreshold } from "../../badge/cycle/fallback-badge-threshold.js";
import { RegionalRewardRollup, newRegionalRewardRollup } from "./regional-reward-rollup.js";

export function summarizeFallbackBadgeThresholdsForRollup(items: FallbackBadgeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRegionalRewardRollupsFromThreshold(items: FallbackBadgeThreshold[]): RegionalRewardRollup[] {
  const out: RegionalRewardRollup[] = [];
  for (const item of items) {
    const derived = newRegionalRewardRollup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRegionalRewardRollup(item: RegionalRewardRollup): string {
  return badgeCycleBucket(item.netLoad());
}
