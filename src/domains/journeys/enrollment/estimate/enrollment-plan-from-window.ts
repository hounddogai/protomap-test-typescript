import { classifyStepWindow } from "../../step/window/step-window-policy.js";
import { StepWindow } from "../../step/window/step-window.js";
import { EnrollmentPlan, newEnrollmentPlan } from "./enrollment-plan.js";

export function summarizeStepWindowsForPlan(items: StepWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveEnrollmentPlansFromWindow(items: StepWindow[]): EnrollmentPlan[] {
  const out: EnrollmentPlan[] = [];
  for (const item of items) {
    const derived = newEnrollmentPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateEnrollmentPlan(item: EnrollmentPlan): string {
  return classifyStepWindow(item.measuredValue());
}
