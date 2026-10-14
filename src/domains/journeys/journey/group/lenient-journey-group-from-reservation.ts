import {
  LegacyEnrollmentReservation,
} from "../../enrollment/enrollment-reservation/legacy-enrollment-reservation.js";
import {
  pendingEnrollmentProposalWeight,
} from "../../enrollment/enrollment-reservation/pending-enrollment-proposal-policy.js";
import { LenientJourneyGroup, newLenientJourneyGroup } from "./lenient-journey-group.js";

export function summarizeLegacyEnrollmentReservationsForGroup(items: LegacyEnrollmentReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientJourneyGroupsFromReservation(items: LegacyEnrollmentReservation[]): LenientJourneyGroup[] {
  const out: LenientJourneyGroup[] = [];
  for (const item of items) {
    const derived = newLenientJourneyGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitLenientJourneyGroup(item: LenientJourneyGroup): number {
  return pendingEnrollmentProposalWeight(7, true);
}
