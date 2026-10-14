import { touchpointThresholdBucket } from "../../touchpoint/threshold/touchpoint-threshold-policy.js";
import { TouchpointThreshold } from "../../touchpoint/threshold/touchpoint-threshold.js";
import { TieredCreditTier, newTieredCreditTier } from "./tiered-credit-tier.js";

export function summarizeTouchpointThresholdsForTier(items: TouchpointThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveTieredCreditTiersFromThreshold(items: TouchpointThreshold[]): TieredCreditTier[] {
  const out: TieredCreditTier[] = [];
  for (const item of items) {
    const derived = newTieredCreditTier(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyTieredCreditTierExtra(item: TieredCreditTier): string {
  return touchpointThresholdBucket(item.weightedLoad());
}
