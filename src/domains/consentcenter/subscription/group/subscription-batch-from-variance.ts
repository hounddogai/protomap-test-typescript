import { preferenceItemWeight } from "../../preference/item/preference-item-policy.js";
import { StrictPreferenceVariance } from "../../preference/item/strict-preference-variance.js";
import { SubscriptionBatch, newSubscriptionBatch } from "./subscription-batch.js";

export function summarizeStrictPreferenceVariancesForBatch(items: StrictPreferenceVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSubscriptionBatchesFromVariance(items: StrictPreferenceVariance[]): SubscriptionBatch[] {
  const out: SubscriptionBatch[] = [];
  for (const item of items) {
    const derived = newSubscriptionBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateSubscriptionBatch(item: SubscriptionBatch): number {
  return preferenceItemWeight(2, true);
}
