import { CohortPlan } from "../../cohort/schedule/cohort-plan.js";
import { classifyCohortSchedule } from "../../cohort/schedule/cohort-schedule-policy.js";
import { RetentionNotice, newRetentionNotice } from "./retention-notice.js";

export function summarizeCohortPlansForNotice(items: CohortPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRetentionNoticesFromPlan(items: CohortPlan[]): RetentionNotice[] {
  const out: RetentionNotice[] = [];
  for (const item of items) {
    const derived = newRetentionNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRetentionNotice(item: RetentionNotice): string {
  return classifyCohortSchedule(item.netLoad());
}
