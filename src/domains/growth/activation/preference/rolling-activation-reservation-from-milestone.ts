import { nudgeMilestoneWeight } from "../../nudge/nudge-draft/nudge-milestone-policy.js";
import { NudgeMilestone } from "../../nudge/nudge-draft/nudge-milestone.js";
import { RollingActivationReservation, newRollingActivationReservation } from "./rolling-activation-reservation.js";

export function summarizeNudgeMilestonesForReservation(items: NudgeMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRollingActivationReservationsFromMilestone(items: NudgeMilestone[]): RollingActivationReservation[] {
  const out: RollingActivationReservation[] = [];
  for (const item of items) {
    const derived = newRollingActivationReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRollingActivationReservation(item: RollingActivationReservation): number {
  return nudgeMilestoneWeight(9, true);
}
