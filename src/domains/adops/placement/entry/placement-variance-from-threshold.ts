import { BidRuleThreshold } from "../../bid-rule/allocation/bid-rule-threshold.js";
import { normalizeSeasonalBidRuleBundleCode } from "../../bid-rule/allocation/seasonal-bid-rule-bundle-policy.js";
import { PlacementVariance, newPlacementVariance } from "./placement-variance.js";

export function summarizeBidRuleThresholdsForVariance(items: BidRuleThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePlacementVariancesFromThreshold(items: BidRuleThreshold[]): PlacementVariance[] {
  const out: PlacementVariance[] = [];
  for (const item of items) {
    const derived = newPlacementVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPlacementVariance(item: PlacementVariance): string {
  return normalizeSeasonalBidRuleBundleCode(item.code);
}
