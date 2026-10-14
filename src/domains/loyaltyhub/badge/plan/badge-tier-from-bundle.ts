import { classifyManualRewardException } from "../../reward/reward-summary/manual-reward-exception-policy.js";
import { TieredRewardBundle } from "../../reward/reward-summary/tiered-reward-bundle.js";
import { BadgeTier, newBadgeTier } from "./badge-tier.js";

export function summarizeTieredRewardBundlesForTier(items: TieredRewardBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBadgeTiersFromBundle(items: TieredRewardBundle[]): BadgeTier[] {
  const out: BadgeTier[] = [];
  for (const item of items) {
    const derived = newBadgeTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBadgeTier(item: BadgeTier): string {
  return classifyManualRewardException(item.effectiveTotal());
}
