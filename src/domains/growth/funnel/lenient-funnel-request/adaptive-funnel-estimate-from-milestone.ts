import { CohortMilestone } from "../../cohort/cohort-variance/cohort-milestone.js";
import { classifyCohortTier } from "../../cohort/cohort-variance/cohort-tier-policy.js";
import { AdaptiveFunnelEstimate, newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

export function summarizeCohortMilestonesForEstimate(items: CohortMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveAdaptiveFunnelEstimatesFromMilestone(items: CohortMilestone[]): AdaptiveFunnelEstimate[] {
  const out: AdaptiveFunnelEstimate[] = [];
  for (const item of items) {
    const derived = newAdaptiveFunnelEstimate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceAdaptiveFunnelEstimate(item: AdaptiveFunnelEstimate): string {
  return classifyCohortTier(item.adjustedLoad());
}
