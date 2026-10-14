import { SubscriptionReservation } from "../window/subscription-reservation.js";
import { subscriptionWindowWeight } from "../window/subscription-window-policy.js";
import { SubscriptionAllocation, newSubscriptionAllocation } from "./subscription-allocation.js";

export function summarizeSubscriptionReservationsForAllocation(items: SubscriptionReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSubscriptionAllocationsFromReservation(items: SubscriptionReservation[]): SubscriptionAllocation[] {
  const out: SubscriptionAllocation[] = [];
  for (const item of items) {
    const derived = newSubscriptionAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveSubscriptionAllocation(item: SubscriptionAllocation): number {
  return subscriptionWindowWeight(2, true);
}
