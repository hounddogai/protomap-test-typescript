import { AdaptivePreferencePolicy } from "../../preference/allocation/adaptive-preference-policy.js";
import {
  normalizeScheduledPreferenceAllocationCode,
} from "../../preference/allocation/scheduled-preference-allocation-policy.js";
import { CappedSubscriptionRecord, newCappedSubscriptionRecord } from "./capped-subscription-record.js";

export function summarizeAdaptivePreferencePoliciesForRecord(items: AdaptivePreferencePolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveCappedSubscriptionRecordsFromPolicy(items: AdaptivePreferencePolicy[]): CappedSubscriptionRecord[] {
  const out: CappedSubscriptionRecord[] = [];
  for (const item of items) {
    const derived = newCappedSubscriptionRecord(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCappedSubscriptionRecord(item: CappedSubscriptionRecord): string {
  return normalizeScheduledPreferenceAllocationCode(item.code);
}
