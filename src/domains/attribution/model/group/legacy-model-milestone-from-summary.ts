import { globalWindowReviewWeight } from "../../window/window-review/global-window-review-policy.js";
import { RollingWindowSummary } from "../../window/window-review/rolling-window-summary.js";
import { LegacyModelMilestone, newLegacyModelMilestone } from "./legacy-model-milestone.js";

export function summarizeRollingWindowSummariesForMilestone(items: RollingWindowSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLegacyModelMilestonesFromSummary(items: RollingWindowSummary[]): LegacyModelMilestone[] {
  const out: LegacyModelMilestone[] = [];
  for (const item of items) {
    const derived = newLegacyModelMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLegacyModelMilestone(item: LegacyModelMilestone): number {
  return globalWindowReviewWeight(9, true);
}
