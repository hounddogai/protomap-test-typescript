import { FallbackNudgeSummary } from "../../nudge/regional-nudge-exception/fallback-nudge-summary.js";
import { classifyManualNudgeException } from "../../nudge/regional-nudge-exception/manual-nudge-exception-policy.js";
import { CohortMilestone, newCohortMilestone } from "./cohort-milestone.js";

export function summarizeFallbackNudgeSummariesForMilestone(items: FallbackNudgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCohortMilestonesFromSummary(items: FallbackNudgeSummary[]): CohortMilestone[] {
  const out: CohortMilestone[] = [];
  for (const item of items) {
    const derived = newCohortMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCohortMilestone(item: CohortMilestone): string {
  return classifyManualNudgeException(item.adjustedExposure());
}
