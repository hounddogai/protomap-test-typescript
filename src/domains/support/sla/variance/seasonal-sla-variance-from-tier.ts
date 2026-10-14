import { classifyDeflectionTier } from "../../deflection/tier/deflection-tier-policy.js";
import { DeflectionTier } from "../../deflection/tier/deflection-tier.js";
import { SeasonalSlaVariance, newSeasonalSlaVariance } from "./seasonal-sla-variance.js";

export function summarizeDeflectionTiersForVariance(items: DeflectionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveSeasonalSlaVariancesFromTier(items: DeflectionTier[]): SeasonalSlaVariance[] {
  const out: SeasonalSlaVariance[] = [];
  for (const item of items) {
    const derived = newSeasonalSlaVariance(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalSlaVariance(item: SeasonalSlaVariance): string {
  return classifyDeflectionTier(item.projectedExposure());
}
