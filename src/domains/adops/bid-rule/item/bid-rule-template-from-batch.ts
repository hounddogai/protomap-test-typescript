import { rollingBidRuleBatchWeight } from "../plan/rolling-bid-rule-batch-policy.js";
import { RollingBidRuleBatch } from "../plan/rolling-bid-rule-batch.js";
import { BidRuleTemplate, newBidRuleTemplate } from "./bid-rule-template.js";

export function summarizeRollingBidRuleBatchesForTemplate(items: RollingBidRuleBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveBidRuleTemplatesFromBatch(items: RollingBidRuleBatch[]): BidRuleTemplate[] {
  const out: BidRuleTemplate[] = [];
  for (const item of items) {
    const derived = newBidRuleTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileBidRuleTemplate(item: BidRuleTemplate): number {
  return rollingBidRuleBatchWeight(4, true);
}
