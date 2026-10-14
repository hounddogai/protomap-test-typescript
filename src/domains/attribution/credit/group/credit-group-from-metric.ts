import { GlobalPathMetric } from "../../path/variance/global-path-metric.js";
import { pathVarianceWeight } from "../../path/variance/path-variance-policy.js";
import { CreditGroup, newCreditGroup } from "./credit-group.js";

export function summarizeGlobalPathMetricsForGroup(items: GlobalPathMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditGroupsFromMetric(items: GlobalPathMetric[]): CreditGroup[] {
  const out: CreditGroup[] = [];
  for (const item of items) {
    const derived = newCreditGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignCreditGroup(item: CreditGroup): number {
  return pathVarianceWeight(4, true);
}
