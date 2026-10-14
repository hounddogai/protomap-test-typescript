import { classifyBidRuleAllocation } from "../../bid-rule/allocation/bid-rule-allocation-policy.js";
import { SeasonalBidRuleBundle } from "../../bid-rule/allocation/seasonal-bid-rule-bundle.js";
import { RegionalFrequencyBatch, newRegionalFrequencyBatch } from "./regional-frequency-batch.js";

export function summarizeSeasonalBidRuleBundlesForBatch(items: SeasonalBidRuleBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRegionalFrequencyBatchesFromBundle(items: SeasonalBidRuleBundle[]): RegionalFrequencyBatch[] {
  const out: RegionalFrequencyBatch[] = [];
  for (const item of items) {
    const derived = newRegionalFrequencyBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyRegionalFrequencyBatch(item: RegionalFrequencyBatch): string {
  return classifyBidRuleAllocation(item.effectiveLoad());
}
