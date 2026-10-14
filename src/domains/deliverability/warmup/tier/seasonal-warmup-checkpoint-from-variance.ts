import { FallbackReputationVariance } from "../../reputation/reputation-ledger/fallback-reputation-variance.js";
import { weightedReputationRuleBucket } from "../../reputation/reputation-ledger/weighted-reputation-rule-policy.js";
import { SeasonalWarmupCheckpoint, newSeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

export function summarizeFallbackReputationVariancesForCheckpoint(items: FallbackReputationVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalWarmupCheckpointsFromVariance(items: FallbackReputationVariance[]): SeasonalWarmupCheckpoint[] {
  const out: SeasonalWarmupCheckpoint[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupCheckpoint(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalWarmupCheckpoint(item: SeasonalWarmupCheckpoint): string {
  return weightedReputationRuleBucket(item.effectiveTotal());
}
