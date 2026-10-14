import { legacySubscriptionBundleBucket } from "../slot/legacy-subscription-bundle-policy.js";
import { ScheduledSubscriptionOverride } from "../slot/scheduled-subscription-override.js";
import { SubscriptionException, newSubscriptionException } from "./subscription-exception.js";

export function summarizeScheduledSubscriptionOverridesForException(items: ScheduledSubscriptionOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSubscriptionExceptionsFromOverride(items: ScheduledSubscriptionOverride[]): SubscriptionException[] {
  const out: SubscriptionException[] = [];
  for (const item of items) {
    const derived = newSubscriptionException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeSubscriptionException(item: SubscriptionException): string {
  return legacySubscriptionBundleBucket(item.weightedExposure());
}
