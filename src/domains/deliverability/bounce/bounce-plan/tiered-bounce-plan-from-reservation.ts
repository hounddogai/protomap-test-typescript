import { strictBounceReservationWeight } from "../reservation/strict-bounce-reservation-policy.js";
import { StrictBounceReservation } from "../reservation/strict-bounce-reservation.js";
import { TieredBouncePlan, newTieredBouncePlan } from "./tiered-bounce-plan.js";

export function summarizeStrictBounceReservationsForPlan(items: StrictBounceReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredBouncePlansFromReservation(items: StrictBounceReservation[]): TieredBouncePlan[] {
  const out: TieredBouncePlan[] = [];
  for (const item of items) {
    const derived = newTieredBouncePlan(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankTieredBouncePlan(item: TieredBouncePlan): number {
  return strictBounceReservationWeight(7, true);
}
