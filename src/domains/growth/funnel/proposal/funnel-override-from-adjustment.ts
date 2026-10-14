import { fallbackFunnelEstimateWeight } from "../funnel-adjustment/fallback-funnel-estimate-policy.js";
import { WeightedFunnelAdjustment } from "../funnel-adjustment/weighted-funnel-adjustment.js";
import { FunnelOverride, newFunnelOverride } from "./funnel-override.js";

export function summarizeWeightedFunnelAdjustmentsForOverride(items: WeightedFunnelAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveFunnelOverridesFromAdjustment(items: WeightedFunnelAdjustment[]): FunnelOverride[] {
  const out: FunnelOverride[] = [];
  for (const item of items) {
    const derived = newFunnelOverride(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeFunnelOverride(item: FunnelOverride): number {
  return fallbackFunnelEstimateWeight(6, true);
}
