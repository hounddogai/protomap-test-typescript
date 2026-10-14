import { classifyStepBundle } from "../../step/adjustment/step-bundle-policy.js";
import { StepCycle } from "../../step/adjustment/step-cycle.js";
import { EnrollmentSchedule, newEnrollmentSchedule } from "./enrollment-schedule.js";

export function summarizeStepCyclesForSchedule(items: StepCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveEnrollmentSchedulesFromCycle(items: StepCycle[]): EnrollmentSchedule[] {
  const out: EnrollmentSchedule[] = [];
  for (const item of items) {
    const derived = newEnrollmentSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyEnrollmentSchedule(item: EnrollmentSchedule): string {
  return classifyStepBundle(item.weightedLoad());
}
