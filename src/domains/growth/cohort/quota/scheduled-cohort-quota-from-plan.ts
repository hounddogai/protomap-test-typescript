import { NudgePlan } from "../../nudge/exception/nudge-plan.js";
import { strictNudgeMappingBucket } from "../../nudge/exception/strict-nudge-mapping-policy.js";
import { ScheduledCohortQuota, newScheduledCohortQuota } from "./scheduled-cohort-quota.js";

export function summarizeNudgePlansForQuota(items: NudgePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveScheduledCohortQuotasFromPlan(items: NudgePlan[]): ScheduledCohortQuota[] {
  const out: ScheduledCohortQuota[] = [];
  for (const item of items) {
    const derived = newScheduledCohortQuota(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateScheduledCohortQuota(item: ScheduledCohortQuota): string {
  return strictNudgeMappingBucket(item.measuredValue());
}
