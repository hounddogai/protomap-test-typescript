import { CreditVariance } from "../../credit/forecast/credit-variance.js";
import { classifyFallbackCreditException } from "../../credit/forecast/fallback-credit-exception-policy.js";
import { ScheduledPathEstimate, newScheduledPathEstimate } from "./scheduled-path-estimate.js";

export function summarizeCreditVariancesForEstimate(items: CreditVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveScheduledPathEstimatesFromVariance(items: CreditVariance[]): ScheduledPathEstimate[] {
  const out: ScheduledPathEstimate[] = [];
  for (const item of items) {
    const derived = newScheduledPathEstimate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitScheduledPathEstimate(item: ScheduledPathEstimate): string {
  return classifyFallbackCreditException(item.adjustedValue());
}
