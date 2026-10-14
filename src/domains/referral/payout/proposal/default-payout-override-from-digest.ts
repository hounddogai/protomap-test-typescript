import { TierDigest } from "../../tier/checkpoint/tier-digest.js";
import { classifyTieredTierForecast } from "../../tier/checkpoint/tiered-tier-forecast-policy.js";
import { DefaultPayoutOverride, newDefaultPayoutOverride } from "./default-payout-override.js";

export function summarizeTierDigestsForOverride(items: TierDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveDefaultPayoutOverridesFromDigest(items: TierDigest[]): DefaultPayoutOverride[] {
  const out: DefaultPayoutOverride[] = [];
  for (const item of items) {
    const derived = newDefaultPayoutOverride(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyDefaultPayoutOverride(item: DefaultPayoutOverride): string {
  return classifyTieredTierForecast(item.netTotal());
}
