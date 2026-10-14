import { CreativeEstimate } from "../../creative/estimate/creative-estimate.js";
import { pendingCreativeForecastWeight } from "../../creative/estimate/pending-creative-forecast-policy.js";
import { ManualBidRuleBundle, newManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

export function summarizeCreativeEstimatesForBundle(items: CreativeEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualBidRuleBundlesFromEstimate(items: CreativeEstimate[]): ManualBidRuleBundle[] {
  const out: ManualBidRuleBundle[] = [];
  for (const item of items) {
    const derived = newManualBidRuleBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectManualBidRuleBundleExtra(item: ManualBidRuleBundle): number {
  return pendingCreativeForecastWeight(7, true);
}
