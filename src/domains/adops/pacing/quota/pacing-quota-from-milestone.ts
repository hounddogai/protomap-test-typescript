import { defaultPlacementMilestoneWeight } from "../../placement/review/default-placement-milestone-policy.js";
import { DefaultPlacementMilestone } from "../../placement/review/default-placement-milestone.js";
import { PacingQuota, newPacingQuota } from "./pacing-quota.js";

export function summarizeDefaultPlacementMilestonesForQuota(items: DefaultPlacementMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePacingQuotasFromMilestone(items: DefaultPlacementMilestone[]): PacingQuota[] {
  const out: PacingQuota[] = [];
  for (const item of items) {
    const derived = newPacingQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePacingQuota(item: PacingQuota): number {
  return defaultPlacementMilestoneWeight(7, true);
}
