import { BidRuleItem } from "../../bid-rule/item/bid-rule-item.js";
import { classifyFallbackBidRulePreference } from "../../bid-rule/item/fallback-bid-rule-preference-policy.js";
import { LenientPlacementDigest, newLenientPlacementDigest } from "./lenient-placement-digest.js";

export function summarizeBidRuleItemsForDigest(items: BidRuleItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLenientPlacementDigestsFromItem(items: BidRuleItem[]): LenientPlacementDigest[] {
  const out: LenientPlacementDigest[] = [];
  for (const item of items) {
    const derived = newLenientPlacementDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLenientPlacementDigest(item: LenientPlacementDigest): string {
  return classifyFallbackBidRulePreference(item.weightedExposure());
}
