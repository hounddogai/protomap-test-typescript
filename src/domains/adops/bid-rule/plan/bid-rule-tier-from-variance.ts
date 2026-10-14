import { manualPacingReviewWeight } from "../../pacing/review/manual-pacing-review-policy.js";
import { RegionalPacingVariance } from "../../pacing/review/regional-pacing-variance.js";
import { BidRuleTier, newBidRuleTier } from "./bid-rule-tier.js";

export function summarizeRegionalPacingVariancesForTier(items: RegionalPacingVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBidRuleTiersFromVariance(items: RegionalPacingVariance[]): BidRuleTier[] {
  const out: BidRuleTier[] = [];
  for (const item of items) {
    const derived = newBidRuleTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchBidRuleTier(item: BidRuleTier): number {
  return manualPacingReviewWeight(2, true);
}
