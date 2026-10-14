import { retentionVarianceWeight } from "../../retention/retention-record/retention-variance-policy.js";
import { RetentionVariance } from "../../retention/retention-record/retention-variance.js";
import { SeasonalActivationTier, newSeasonalActivationTier } from "./seasonal-activation-tier.js";

export function summarizeRetentionVariancesForTier(items: RetentionVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveSeasonalActivationTiersFromVariance(items: RetentionVariance[]): SeasonalActivationTier[] {
  const out: SeasonalActivationTier[] = [];
  for (const item of items) {
    const derived = newSeasonalActivationTier(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalActivationTier(item: SeasonalActivationTier): number {
  return retentionVarianceWeight(6, true);
}
