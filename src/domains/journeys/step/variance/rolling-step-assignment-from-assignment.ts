import { classifyStepAssignment } from "../audit/step-assignment-policy.js";
import { StepAssignment } from "../audit/step-assignment.js";
import { RollingStepAssignment, newRollingStepAssignment } from "./rolling-step-assignment.js";

export function summarizeStepAssignmentsForAssignment(items: StepAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRollingStepAssignmentsFromAssignment(items: StepAssignment[]): RollingStepAssignment[] {
  const out: RollingStepAssignment[] = [];
  for (const item of items) {
    const derived = newRollingStepAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planRollingStepAssignment(item: RollingStepAssignment): string {
  return classifyStepAssignment(item.projectedValue());
}
