import { SubscriptionPolicy } from "../../subscription/window/subscription-policy.js";
import { subscriptionReservationWeight } from "../../subscription/window/subscription-reservation-policy.js";
import { DoubleOptInException, newDoubleOptInException } from "./double-opt-in-exception.js";

export function summarizeSubscriptionPoliciesForException(items: SubscriptionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDoubleOptInExceptionsFromPolicy(items: SubscriptionPolicy[]): DoubleOptInException[] {
  const out: DoubleOptInException[] = [];
  for (const item of items) {
    const derived = newDoubleOptInException(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateDoubleOptInException(item: DoubleOptInException): number {
  return subscriptionReservationWeight(1, true);
}
