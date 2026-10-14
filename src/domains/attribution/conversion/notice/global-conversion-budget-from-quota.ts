import { adaptiveConversionQuotaWeight } from "../conversion-record/adaptive-conversion-quota-policy.js";
import { AdaptiveConversionQuota } from "../conversion-record/adaptive-conversion-quota.js";
import { GlobalConversionBudget, newGlobalConversionBudget } from "./global-conversion-budget.js";

export function summarizeAdaptiveConversionQuotasForBudget(items: AdaptiveConversionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveGlobalConversionBudgetsFromQuota(items: AdaptiveConversionQuota[]): GlobalConversionBudget[] {
  const out: GlobalConversionBudget[] = [];
  for (const item of items) {
    const derived = newGlobalConversionBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalConversionBudget(item: GlobalConversionBudget): number {
  return adaptiveConversionQuotaWeight(3, true);
}
