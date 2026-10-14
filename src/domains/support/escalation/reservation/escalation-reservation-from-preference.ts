import { escalationAgreementBucket } from "../agreement/escalation-agreement-policy.js";
import { EscalationPreference } from "../agreement/escalation-preference.js";
import { EscalationReservation, newEscalationReservation } from "./escalation-reservation.js";

export function summarizeEscalationPreferencesForReservation(items: EscalationPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveEscalationReservationsFromPreference(items: EscalationPreference[]): EscalationReservation[] {
  const out: EscalationReservation[] = [];
  for (const item of items) {
    const derived = newEscalationReservation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeEscalationReservation(item: EscalationReservation): string {
  return escalationAgreementBucket(item.projectedExposure());
}
