import { BatchedPlacementDraft } from "../../placement/notice/batched-placement-draft.js";
import { classifyRollingPlacementAudit } from "../../placement/notice/rolling-placement-audit-policy.js";
import { FlightMilestone, newFlightMilestone } from "./flight-milestone.js";

export function summarizeBatchedPlacementDraftsForMilestone(items: BatchedPlacementDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFlightMilestonesFromDraft(items: BatchedPlacementDraft[]): FlightMilestone[] {
  const out: FlightMilestone[] = [];
  for (const item of items) {
    const derived = newFlightMilestone(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateFlightMilestone(item: FlightMilestone): string {
  return classifyRollingPlacementAudit(item.effectiveExposure());
}
