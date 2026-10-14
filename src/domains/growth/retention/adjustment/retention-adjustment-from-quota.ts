import { scheduledCohortQuotaWeight } from "../../cohort/quota/scheduled-cohort-quota-policy.js";
import { ScheduledCohortQuota } from "../../cohort/quota/scheduled-cohort-quota.js";
import { RetentionAdjustment, newRetentionAdjustment } from "./retention-adjustment.js";

export function summarizeScheduledCohortQuotasForAdjustment(items: ScheduledCohortQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRetentionAdjustmentsFromQuota(items: ScheduledCohortQuota[]): RetentionAdjustment[] {
  const out: RetentionAdjustment[] = [];
  for (const item of items) {
    const derived = newRetentionAdjustment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRetentionAdjustment(item: RetentionAdjustment): number {
  return scheduledCohortQuotaWeight(5, true);
}
