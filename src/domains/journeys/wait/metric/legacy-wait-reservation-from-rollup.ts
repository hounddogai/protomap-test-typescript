import { enrollmentRollupBucket } from "../../enrollment/rollup/enrollment-rollup-policy.js";
import { EnrollmentRollup } from "../../enrollment/rollup/enrollment-rollup.js";
import { LegacyWaitReservation, newLegacyWaitReservation } from "./legacy-wait-reservation.js";

export function summarizeEnrollmentRollupsForReservation(items: EnrollmentRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLegacyWaitReservationsFromRollup(items: EnrollmentRollup[]): LegacyWaitReservation[] {
  const out: LegacyWaitReservation[] = [];
  for (const item of items) {
    const derived = newLegacyWaitReservation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileLegacyWaitReservation(item: LegacyWaitReservation): string {
  return enrollmentRollupBucket(item.adjustedTotal());
}
