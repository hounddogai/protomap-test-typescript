import { inviteReservationWeight } from "../../invite/reservation/invite-reservation-policy.js";
import { InviteReservation } from "../../invite/reservation/invite-reservation.js";
import { WeightedPayoutSegment, newWeightedPayoutSegment } from "./weighted-payout-segment.js";

export function summarizeInviteReservationsForSegment(items: InviteReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWeightedPayoutSegmentsFromReservation(items: InviteReservation[]): WeightedPayoutSegment[] {
  const out: WeightedPayoutSegment[] = [];
  for (const item of items) {
    const derived = newWeightedPayoutSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveWeightedPayoutSegment(item: WeightedPayoutSegment): number {
  return inviteReservationWeight(1, true);
}
