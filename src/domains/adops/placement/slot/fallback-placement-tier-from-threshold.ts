import { DefaultCreativeThreshold } from "../../creative/mapping/default-creative-threshold.js";
import { normalizeLenientCreativeRequestCode } from "../../creative/mapping/lenient-creative-request-policy.js";
import { FallbackPlacementTier, newFallbackPlacementTier } from "./fallback-placement-tier.js";

export function summarizeDefaultCreativeThresholdsForTier(items: DefaultCreativeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveFallbackPlacementTiersFromThreshold(items: DefaultCreativeThreshold[]): FallbackPlacementTier[] {
  const out: FallbackPlacementTier[] = [];
  for (const item of items) {
    const derived = newFallbackPlacementTier(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankFallbackPlacementTier(item: FallbackPlacementTier): string {
  return normalizeLenientCreativeRequestCode(item.code);
}
