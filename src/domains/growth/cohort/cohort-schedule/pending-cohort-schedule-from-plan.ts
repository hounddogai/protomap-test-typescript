import { GlobalRetentionPlan } from "../../retention/template/global-retention-plan.js";
import { retentionScheduleWeight } from "../../retention/template/retention-schedule-policy.js";
import { PendingCohortSchedule, newPendingCohortSchedule } from "./pending-cohort-schedule.js";

export function summarizeGlobalRetentionPlansForSchedule(items: GlobalRetentionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePendingCohortSchedulesFromPlan(items: GlobalRetentionPlan[]): PendingCohortSchedule[] {
  const out: PendingCohortSchedule[] = [];
  for (const item of items) {
    const derived = newPendingCohortSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPendingCohortSchedule(item: PendingCohortSchedule): number {
  return retentionScheduleWeight(5, true);
}
