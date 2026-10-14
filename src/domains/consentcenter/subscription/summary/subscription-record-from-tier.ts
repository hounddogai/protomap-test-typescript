import { defaultPreferenceScheduleWeight } from "../../preference/tier/default-preference-schedule-policy.js";
import { GlobalPreferenceTier } from "../../preference/tier/global-preference-tier.js";
import { SubscriptionRecord, newSubscriptionRecord } from "./subscription-record.js";

export function summarizeGlobalPreferenceTiersForRecord(items: GlobalPreferenceTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSubscriptionRecordsFromTier(items: GlobalPreferenceTier[]): SubscriptionRecord[] {
  const out: SubscriptionRecord[] = [];
  for (const item of items) {
    const derived = newSubscriptionRecord(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeSubscriptionRecord(item: SubscriptionRecord): number {
  return defaultPreferenceScheduleWeight(2, true);
}
