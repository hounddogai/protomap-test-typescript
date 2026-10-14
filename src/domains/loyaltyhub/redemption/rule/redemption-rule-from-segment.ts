import { globalRedemptionSegmentBucket } from "../preference/global-redemption-segment-policy.js";
import { GlobalRedemptionSegment } from "../preference/global-redemption-segment.js";
import { RedemptionRule, newRedemptionRule } from "./redemption-rule.js";

export function summarizeGlobalRedemptionSegmentsForRule(items: GlobalRedemptionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRedemptionRulesFromSegment(items: GlobalRedemptionSegment[]): RedemptionRule[] {
  const out: RedemptionRule[] = [];
  for (const item of items) {
    const derived = newRedemptionRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRedemptionRule(item: RedemptionRule): string {
  return globalRedemptionSegmentBucket(item.netLoad());
}
