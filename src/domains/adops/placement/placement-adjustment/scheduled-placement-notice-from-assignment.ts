import { FlightAssignment } from "../../flight/plan/flight-assignment.js";
import { normalizeManualFlightClaimCode } from "../../flight/plan/manual-flight-claim-policy.js";
import { ScheduledPlacementNotice, newScheduledPlacementNotice } from "./scheduled-placement-notice.js";

export function summarizeFlightAssignmentsForNotice(items: FlightAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveScheduledPlacementNoticesFromAssignment(items: FlightAssignment[]): ScheduledPlacementNotice[] {
  const out: ScheduledPlacementNotice[] = [];
  for (const item of items) {
    const derived = newScheduledPlacementNotice(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planScheduledPlacementNotice(item: ScheduledPlacementNotice): string {
  return normalizeManualFlightClaimCode(item.code);
}
