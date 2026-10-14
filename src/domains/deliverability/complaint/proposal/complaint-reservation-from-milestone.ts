import { bounceMilestoneWeight } from "../../bounce/milestone/bounce-milestone-policy.js";
import { BounceMilestone } from "../../bounce/milestone/bounce-milestone.js";
import { ComplaintReservation, newComplaintReservation } from "./complaint-reservation.js";

export function summarizeBounceMilestonesForReservation(items: BounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveComplaintReservationsFromMilestone(items: BounceMilestone[]): ComplaintReservation[] {
  const out: ComplaintReservation[] = [];
  for (const item of items) {
    const derived = newComplaintReservation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleComplaintReservation(item: ComplaintReservation): number {
  return bounceMilestoneWeight(6, true);
}
