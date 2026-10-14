import { DoubleOptInQuota } from "../../double-opt-in/batch/double-opt-in-quota.js";
import { doubleOptInRollupWeight } from "../../double-opt-in/batch/double-opt-in-rollup-policy.js";
import { PreferenceException, newPreferenceException } from "./preference-exception.js";

export function summarizeDoubleOptInQuotasForException(items: DoubleOptInQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePreferenceExceptionsFromQuota(items: DoubleOptInQuota[]): PreferenceException[] {
  const out: PreferenceException[] = [];
  for (const item of items) {
    const derived = newPreferenceException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePreferenceException(item: PreferenceException): number {
  return doubleOptInRollupWeight(5, true);
}
