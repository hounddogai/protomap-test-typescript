import { DefaultSubscriptionPlan } from "../../subscription/snapshot/default-subscription-plan.js";
import { globalSubscriptionEstimateBucket } from "../../subscription/snapshot/global-subscription-estimate-policy.js";
import { ManualPreferenceBaseline, newManualPreferenceBaseline } from "./manual-preference-baseline.js";

export function summarizeDefaultSubscriptionPlansForBaseline(items: DefaultSubscriptionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveManualPreferenceBaselinesFromPlan(items: DefaultSubscriptionPlan[]): ManualPreferenceBaseline[] {
  const out: ManualPreferenceBaseline[] = [];
  for (const item of items) {
    const derived = newManualPreferenceBaseline(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveManualPreferenceBaseline(item: ManualPreferenceBaseline): string {
  return globalSubscriptionEstimateBucket(item.effectiveValue());
}
