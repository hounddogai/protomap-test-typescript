import { SeasonalReputationVariance } from "../../reputation/reputation-variance/seasonal-reputation-variance.js";
import { classifyStrictReputationTier } from "../../reputation/reputation-variance/strict-reputation-tier-policy.js";
import { SeasonalWarmupRollup, newSeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

export function summarizeSeasonalReputationVariancesForRollup(items: SeasonalReputationVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveSeasonalWarmupRollupsFromVariance(items: SeasonalReputationVariance[]): SeasonalWarmupRollup[] {
  const out: SeasonalWarmupRollup[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupRollup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateSeasonalWarmupRollup(item: SeasonalWarmupRollup): string {
  return classifyStrictReputationTier(item.weightedExposure());
}
