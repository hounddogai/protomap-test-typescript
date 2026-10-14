import { EnrollmentRecord } from "../../enrollment/slot/enrollment-record.js";
import { classifyGlobalEnrollmentSlot } from "../../enrollment/slot/global-enrollment-slot-policy.js";
import { WaitReservation, newWaitReservation } from "./wait-reservation.js";

export function summarizeEnrollmentRecordsForReservation(items: EnrollmentRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWaitReservationsFromRecord(items: EnrollmentRecord[]): WaitReservation[] {
  const out: WaitReservation[] = [];
  for (const item of items) {
    const derived = newWaitReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeWaitReservation(item: WaitReservation): string {
  return classifyGlobalEnrollmentSlot(item.netExposure());
}
