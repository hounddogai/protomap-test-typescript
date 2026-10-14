import { classifyCohortBudget } from "../variance/cohort-budget-policy.js";
import { LenientCohortQuota } from "../variance/lenient-cohort-quota.js";
import { CohortMilestone, newCohortMilestone } from "./cohort-milestone.js";

export function summarizeLenientCohortQuotasForMilestone(items: LenientCohortQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveCohortMilestonesFromQuota(items: LenientCohortQuota[]): CohortMilestone[] {
  const out: CohortMilestone[] = [];
  for (const item of items) {
    const derived = newCohortMilestone(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planCohortMilestone(item: CohortMilestone): string {
  return classifyCohortBudget(item.adjustedExposure());
}
