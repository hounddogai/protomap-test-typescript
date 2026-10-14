import { fallbackSubscriptionScoreWeight } from "../score/fallback-subscription-score-policy.js";
import { RegionalSubscriptionAllocation } from "../score/regional-subscription-allocation.js";
import { SubscriptionPreference, newSubscriptionPreference } from "./subscription-preference.js";

export function summarizeRegionalSubscriptionAllocationsForPreference(items: RegionalSubscriptionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSubscriptionPreferencesFromAllocation(items: RegionalSubscriptionAllocation[]): SubscriptionPreference[] {
  const out: SubscriptionPreference[] = [];
  for (const item of items) {
    const derived = newSubscriptionPreference(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeSubscriptionPreference(item: SubscriptionPreference): number {
  return fallbackSubscriptionScoreWeight(3, true);
}
