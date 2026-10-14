import { exitRuleScheduleBucket } from "../../exit-rule/schedule/exit-rule-schedule-policy.js";
import { ExitRuleSchedule } from "../../exit-rule/schedule/exit-rule-schedule.js";
import { AdaptiveEnrollmentPlan, newAdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

export function summarizeExitRuleSchedulesForPlan(items: ExitRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveAdaptiveEnrollmentPlansFromSchedule(items: ExitRuleSchedule[]): AdaptiveEnrollmentPlan[] {
  const out: AdaptiveEnrollmentPlan[] = [];
  for (const item of items) {
    const derived = newAdaptiveEnrollmentPlan(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveAdaptiveEnrollmentPlan(item: AdaptiveEnrollmentPlan): string {
  return exitRuleScheduleBucket(item.weightedTotal());
}
