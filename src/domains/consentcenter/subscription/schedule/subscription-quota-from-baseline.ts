import { ManualPreferenceBaseline } from "../../preference/preference-baseline/manual-preference-baseline.js";
import {
  classifyWeightedPreferenceBaseline,
} from "../../preference/preference-baseline/weighted-preference-baseline-policy.js";
import { SubscriptionQuota, newSubscriptionQuota } from "./subscription-quota.js";

export function summarizeManualPreferenceBaselinesForQuota(items: ManualPreferenceBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSubscriptionQuotasFromBaseline(items: ManualPreferenceBaseline[]): SubscriptionQuota[] {
  const out: SubscriptionQuota[] = [];
  for (const item of items) {
    const derived = newSubscriptionQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySubscriptionQuota(item: SubscriptionQuota): string {
  return classifyWeightedPreferenceBaseline(item.effectiveTotal());
}
