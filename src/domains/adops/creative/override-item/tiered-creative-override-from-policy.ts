import { cappedFrequencyReviewWeight } from "../../frequency/frequency-review/capped-frequency-review-policy.js";
import { FrequencyPolicy } from "../../frequency/frequency-review/frequency-policy.js";
import { TieredCreativeOverride, newTieredCreativeOverride } from "./tiered-creative-override.js";

export function summarizeFrequencyPoliciesForOverride(items: FrequencyPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveTieredCreativeOverridesFromPolicy(items: FrequencyPolicy[]): TieredCreativeOverride[] {
  const out: TieredCreativeOverride[] = [];
  for (const item of items) {
    const derived = newTieredCreativeOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTieredCreativeOverride(item: TieredCreativeOverride): number {
  return cappedFrequencyReviewWeight(8, true);
}
