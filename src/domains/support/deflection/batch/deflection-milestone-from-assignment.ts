import {
  legacyTicketViewAssignmentWeight,
} from "../../ticket-view/assignment/legacy-ticket-view-assignment-policy.js";
import { SeasonalTicketViewAssignment } from "../../ticket-view/assignment/seasonal-ticket-view-assignment.js";
import { DeflectionMilestone, newDeflectionMilestone } from "./deflection-milestone.js";

export function summarizeSeasonalTicketViewAssignmentsForMilestone(items: SeasonalTicketViewAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveDeflectionMilestonesFromAssignment(items: SeasonalTicketViewAssignment[]): DeflectionMilestone[] {
  const out: DeflectionMilestone[] = [];
  for (const item of items) {
    const derived = newDeflectionMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeDeflectionMilestone(item: DeflectionMilestone): number {
  return legacyTicketViewAssignmentWeight(3, true);
}
