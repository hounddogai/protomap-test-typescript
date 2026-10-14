import { creditTierBucket } from "../../credit/segment/credit-tier-policy.js";
import { GlobalCreditEstimate } from "../../credit/segment/global-credit-estimate.js";
import { ModelThreshold, newModelThreshold } from "./model-threshold.js";

export function summarizeGlobalCreditEstimatesForThreshold(items: GlobalCreditEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveModelThresholdsFromEstimate(items: GlobalCreditEstimate[]): ModelThreshold[] {
  const out: ModelThreshold[] = [];
  for (const item of items) {
    const derived = newModelThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateModelThreshold(item: ModelThreshold): string {
  return creditTierBucket(item.measuredValue());
}
