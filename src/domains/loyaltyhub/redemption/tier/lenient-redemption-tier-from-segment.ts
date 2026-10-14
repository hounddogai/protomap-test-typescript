import { RedemptionSegment } from "../threshold/redemption-segment.js";
import { redemptionThresholdWeight } from "../threshold/redemption-threshold-policy.js";
import { LenientRedemptionTier, newLenientRedemptionTier } from "./lenient-redemption-tier.js";

export function summarizeRedemptionSegmentsForTier(items: RedemptionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLenientRedemptionTiersFromSegment(items: RedemptionSegment[]): LenientRedemptionTier[] {
  const out: LenientRedemptionTier[] = [];
  for (const item of items) {
    const derived = newLenientRedemptionTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLenientRedemptionTier(item: LenientRedemptionTier): number {
  return redemptionThresholdWeight(4, true);
}
