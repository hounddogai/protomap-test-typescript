import { doubleOptInExceptionBucket } from "../../double-opt-in/preference/double-opt-in-exception-policy.js";
import { DoubleOptInPreference } from "../../double-opt-in/preference/double-opt-in-preference.js";
import { SubscriptionAllocation, newSubscriptionAllocation } from "./subscription-allocation.js";

export function summarizeDoubleOptInPreferencesForAllocation(items: DoubleOptInPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveSubscriptionAllocationsFromPreference(items: DoubleOptInPreference[]): SubscriptionAllocation[] {
  const out: SubscriptionAllocation[] = [];
  for (const item of items) {
    const derived = newSubscriptionAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySubscriptionAllocationExtra(item: SubscriptionAllocation): string {
  return doubleOptInExceptionBucket(item.measuredValue());
}
