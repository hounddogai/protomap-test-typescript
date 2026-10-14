import { subscriptionQuotaBucket } from "../schedule/subscription-quota-policy.js";
import { SubscriptionQuota } from "../schedule/subscription-quota.js";
import { SubscriptionSummary, newSubscriptionSummary } from "./subscription-summary.js";

export function summarizeSubscriptionQuotasForSummary(items: SubscriptionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSubscriptionSummariesFromQuota(items: SubscriptionQuota[]): SubscriptionSummary[] {
  const out: SubscriptionSummary[] = [];
  for (const item of items) {
    const derived = newSubscriptionSummary(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankSubscriptionSummary(item: SubscriptionSummary): string {
  return subscriptionQuotaBucket(item.netValue());
}
