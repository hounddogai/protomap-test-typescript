import { cohortPlanWeight } from "../../cohort/schedule/cohort-plan-policy.js";
import { CohortPlan } from "../../cohort/schedule/cohort-plan.js";
import { ActivationSchedule, newActivationSchedule } from "./activation-schedule.js";

export function summarizeCohortPlansForSchedule(items: CohortPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveActivationSchedulesFromPlan(items: CohortPlan[]): ActivationSchedule[] {
  const out: ActivationSchedule[] = [];
  for (const item of items) {
    const derived = newActivationSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankActivationSchedule(item: ActivationSchedule): number {
  return cohortPlanWeight(5, true);
}
