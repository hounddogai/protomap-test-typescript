import { DoubleOptInQuota } from "../../double-opt-in/batch/double-opt-in-quota.js";
import { doubleOptInRollupWeight } from "../../double-opt-in/batch/double-opt-in-rollup-policy.js";
import { SubscriptionMetric, newSubscriptionMetric } from "./subscription-metric.js";

export function summarizeDoubleOptInQuotasForMetric(items: DoubleOptInQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSubscriptionMetricsFromQuota(items: DoubleOptInQuota[]): SubscriptionMetric[] {
  const out: SubscriptionMetric[] = [];
  for (const item of items) {
    const derived = newSubscriptionMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileSubscriptionMetric(item: SubscriptionMetric): number {
  return doubleOptInRollupWeight(4, true);
}
