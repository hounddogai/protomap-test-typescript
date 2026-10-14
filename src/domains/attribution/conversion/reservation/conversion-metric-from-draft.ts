import { classifyCreditAllocation } from "../../credit/audit/credit-allocation-policy.js";
import { CreditDraft } from "../../credit/audit/credit-draft.js";
import { ConversionMetric, newConversionMetric } from "./conversion-metric.js";

export function summarizeCreditDraftsForMetric(items: CreditDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveConversionMetricsFromDraft(items: CreditDraft[]): ConversionMetric[] {
  const out: ConversionMetric[] = [];
  for (const item of items) {
    const derived = newConversionMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeConversionMetric(item: ConversionMetric): string {
  return classifyCreditAllocation(item.effectiveExposure());
}
