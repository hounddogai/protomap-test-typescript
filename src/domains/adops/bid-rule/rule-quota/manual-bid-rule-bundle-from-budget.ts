import { GlobalFrequencyBudget } from "../../frequency/estimate/global-frequency-budget.js";
import { globalFrequencyClaimBucket } from "../../frequency/estimate/global-frequency-claim-policy.js";
import { ManualBidRuleBundle, newManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

export function summarizeGlobalFrequencyBudgetsForBundle(items: GlobalFrequencyBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualBidRuleBundlesFromBudget(items: GlobalFrequencyBudget[]): ManualBidRuleBundle[] {
  const out: ManualBidRuleBundle[] = [];
  for (const item of items) {
    const derived = newManualBidRuleBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectManualBidRuleBundle(item: ManualBidRuleBundle): string {
  return globalFrequencyClaimBucket(item.projectedValue());
}
