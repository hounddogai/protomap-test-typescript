import { manualTicketViewTierWeight } from "../../ticket-view/assignment/manual-ticket-view-tier-policy.js";
import { SeasonalTicketViewAssignment } from "../../ticket-view/assignment/seasonal-ticket-view-assignment.js";
import { BatchedMacroScore, newBatchedMacroScore } from "./batched-macro-score.js";

export function summarizeSeasonalTicketViewAssignmentsForScore(items: SeasonalTicketViewAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBatchedMacroScoresFromAssignment(items: SeasonalTicketViewAssignment[]): BatchedMacroScore[] {
  const out: BatchedMacroScore[] = [];
  for (const item of items) {
    const derived = newBatchedMacroScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBatchedMacroScore(item: BatchedMacroScore): number {
  return manualTicketViewTierWeight(3, true);
}
