import { rollingExitRuleCheckpointWeight } from "../../exit-rule/score/rolling-exit-rule-checkpoint-policy.js";
import { RollingExitRuleCheckpoint } from "../../exit-rule/score/rolling-exit-rule-checkpoint.js";
import { JourneyReservation, newJourneyReservation } from "./journey-reservation.js";

export function summarizeRollingExitRuleCheckpointsForReservation(items: RollingExitRuleCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveJourneyReservationsFromCheckpoint(items: RollingExitRuleCheckpoint[]): JourneyReservation[] {
  const out: JourneyReservation[] = [];
  for (const item of items) {
    const derived = newJourneyReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitJourneyReservation(item: JourneyReservation): number {
  return rollingExitRuleCheckpointWeight(8, true);
}
