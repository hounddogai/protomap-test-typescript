import { adaptiveWindowGroupBucket } from "../../window/override-item/adaptive-window-group-policy.js";
import { WeightedWindowOverride } from "../../window/override-item/weighted-window-override.js";
import { LegacyCreditThreshold, newLegacyCreditThreshold } from "./legacy-credit-threshold.js";

export function summarizeWeightedWindowOverridesForThreshold(items: WeightedWindowOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLegacyCreditThresholdsFromOverride(items: WeightedWindowOverride[]): LegacyCreditThreshold[] {
  const out: LegacyCreditThreshold[] = [];
  for (const item of items) {
    const derived = newLegacyCreditThreshold(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateLegacyCreditThreshold(item: LegacyCreditThreshold): string {
  return adaptiveWindowGroupBucket(item.effectiveTotal());
}
