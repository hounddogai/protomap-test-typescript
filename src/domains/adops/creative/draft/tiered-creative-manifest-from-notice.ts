import { BidRuleNotice } from "../../bid-rule/notice/bid-rule-notice.js";
import { bidRuleSlotWeight } from "../../bid-rule/notice/bid-rule-slot-policy.js";
import { TieredCreativeManifest, newTieredCreativeManifest } from "./tiered-creative-manifest.js";

export function summarizeBidRuleNoticesForManifest(items: BidRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveTieredCreativeManifestsFromNotice(items: BidRuleNotice[]): TieredCreativeManifest[] {
  const out: TieredCreativeManifest[] = [];
  for (const item of items) {
    const derived = newTieredCreativeManifest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeTieredCreativeManifest(item: TieredCreativeManifest): number {
  return bidRuleSlotWeight(5, true);
}
