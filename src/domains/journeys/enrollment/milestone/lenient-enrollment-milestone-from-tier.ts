import { BatchedExitRuleTier } from "../../exit-rule/summary/batched-exit-rule-tier.js";
import { strictExitRuleSummaryBucket } from "../../exit-rule/summary/strict-exit-rule-summary-policy.js";
import { LenientEnrollmentMilestone, newLenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

export function summarizeBatchedExitRuleTiersForMilestone(items: BatchedExitRuleTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientEnrollmentMilestonesFromTier(items: BatchedExitRuleTier[]): LenientEnrollmentMilestone[] {
  const out: LenientEnrollmentMilestone[] = [];
  for (const item of items) {
    const derived = newLenientEnrollmentMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLenientEnrollmentMilestone(item: LenientEnrollmentMilestone): string {
  return strictExitRuleSummaryBucket(item.effectiveExposure());
}
