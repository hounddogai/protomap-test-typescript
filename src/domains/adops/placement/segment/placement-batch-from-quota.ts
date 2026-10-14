import { bidRuleMappingWeight } from "../../bid-rule/rule-quota/bid-rule-mapping-policy.js";
import { PrimaryBidRuleQuota } from "../../bid-rule/rule-quota/primary-bid-rule-quota.js";
import { PlacementBatch, newPlacementBatch } from "./placement-batch.js";

export function summarizePrimaryBidRuleQuotasForBatch(items: PrimaryBidRuleQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePlacementBatchesFromQuota(items: PrimaryBidRuleQuota[]): PlacementBatch[] {
  const out: PlacementBatch[] = [];
  for (const item of items) {
    const derived = newPlacementBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPlacementBatch(item: PlacementBatch): number {
  return bidRuleMappingWeight(5, true);
}
