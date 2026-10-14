import { ScheduledTouchpointAudit } from "../../touchpoint/proposal/scheduled-touchpoint-audit.js";
import { touchpointProposalBucket } from "../../touchpoint/proposal/touchpoint-proposal-policy.js";
import { ModelReservation, newModelReservation } from "./model-reservation.js";

export function summarizeScheduledTouchpointAuditsForReservation(items: ScheduledTouchpointAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveModelReservationsFromAudit(items: ScheduledTouchpointAudit[]): ModelReservation[] {
  const out: ModelReservation[] = [];
  for (const item of items) {
    const derived = newModelReservation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignModelReservation(item: ModelReservation): string {
  return touchpointProposalBucket(item.measuredValue());
}
