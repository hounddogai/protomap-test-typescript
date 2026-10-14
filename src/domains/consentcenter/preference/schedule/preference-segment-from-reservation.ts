import { normalizeSubscriptionReservationCode } from "../../subscription/window/subscription-reservation-policy.js";
import { SubscriptionReservation } from "../../subscription/window/subscription-reservation.js";
import { PreferenceSegment, newPreferenceSegment } from "./preference-segment.js";

export function summarizeSubscriptionReservationsForSegment(items: SubscriptionReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePreferenceSegmentsFromReservation(items: SubscriptionReservation[]): PreferenceSegment[] {
  const out: PreferenceSegment[] = [];
  for (const item of items) {
    const derived = newPreferenceSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePreferenceSegment(item: PreferenceSegment): string {
  return normalizeSubscriptionReservationCode(item.code);
}
