import {
  normalizePendingSubscriptionSnapshotCode,
} from "../../subscription/request/pending-subscription-snapshot-policy.js";
import { SubscriptionRequest } from "../../subscription/request/subscription-request.js";
import { AdaptivePreferenceBudget, newAdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

export function summarizeSubscriptionRequestsForBudget(items: SubscriptionRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveAdaptivePreferenceBudgetsFromRequest(items: SubscriptionRequest[]): AdaptivePreferenceBudget[] {
  const out: AdaptivePreferenceBudget[] = [];
  for (const item of items) {
    const derived = newAdaptivePreferenceBudget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchAdaptivePreferenceBudget(item: AdaptivePreferenceBudget): string {
  return normalizePendingSubscriptionSnapshotCode(item.code);
}
