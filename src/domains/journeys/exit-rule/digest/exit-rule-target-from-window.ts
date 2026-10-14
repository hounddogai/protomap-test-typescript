import { enrollmentThresholdWeight } from "../../enrollment/reservation/enrollment-threshold-policy.js";
import { RollingEnrollmentWindow } from "../../enrollment/reservation/rolling-enrollment-window.js";
import { ExitRuleTarget, newExitRuleTarget } from "./exit-rule-target.js";

export function summarizeRollingEnrollmentWindowsForTarget(items: RollingEnrollmentWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveExitRuleTargetsFromWindow(items: RollingEnrollmentWindow[]): ExitRuleTarget[] {
  const out: ExitRuleTarget[] = [];
  for (const item of items) {
    const derived = newExitRuleTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeExitRuleTarget(item: ExitRuleTarget): number {
  return enrollmentThresholdWeight(6, true);
}
