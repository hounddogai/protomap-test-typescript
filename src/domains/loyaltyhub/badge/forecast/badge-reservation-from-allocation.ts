import { strictBadgeAllocationBucket } from "../allocation/strict-badge-allocation-policy.js";
import { StrictBadgeAllocation } from "../allocation/strict-badge-allocation.js";
import { BadgeReservation, newBadgeReservation } from "./badge-reservation.js";

export function summarizeStrictBadgeAllocationsForReservation(items: StrictBadgeAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBadgeReservationsFromAllocation(items: StrictBadgeAllocation[]): BadgeReservation[] {
  const out: BadgeReservation[] = [];
  for (const item of items) {
    const derived = newBadgeReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeBadgeReservation(item: BadgeReservation): string {
  return strictBadgeAllocationBucket(item.adjustedExposure());
}
