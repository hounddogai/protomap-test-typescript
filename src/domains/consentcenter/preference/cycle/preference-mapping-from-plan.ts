import { ScheduledSubscriptionPlan } from "../../subscription/plan/scheduled-subscription-plan.js";
import { subscriptionSlotBucket } from "../../subscription/plan/subscription-slot-policy.js";
import { PreferenceMapping, newPreferenceMapping } from "./preference-mapping.js";

export function summarizeScheduledSubscriptionPlansForMapping(items: ScheduledSubscriptionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePreferenceMappingsFromPlan(items: ScheduledSubscriptionPlan[]): PreferenceMapping[] {
  const out: PreferenceMapping[] = [];
  for (const item of items) {
    const derived = newPreferenceMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePreferenceMapping(item: PreferenceMapping): string {
  return subscriptionSlotBucket(item.adjustedLoad());
}
