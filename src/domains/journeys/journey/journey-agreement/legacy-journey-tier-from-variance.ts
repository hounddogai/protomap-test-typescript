import { batchedWaitBaselineWeight } from "../../wait/wait-rule/batched-wait-baseline-policy.js";
import { TieredWaitVariance } from "../../wait/wait-rule/tiered-wait-variance.js";
import { LegacyJourneyTier, newLegacyJourneyTier } from "./legacy-journey-tier.js";

export function summarizeTieredWaitVariancesForTier(items: TieredWaitVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLegacyJourneyTiersFromVariance(items: TieredWaitVariance[]): LegacyJourneyTier[] {
  const out: LegacyJourneyTier[] = [];
  for (const item of items) {
    const derived = newLegacyJourneyTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreLegacyJourneyTier(item: LegacyJourneyTier): number {
  return batchedWaitBaselineWeight(4, true);
}
