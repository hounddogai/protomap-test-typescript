import { DefaultStepBundle } from "../../step/plan/default-step-bundle.js";
import { rollingStepPolicyBucket } from "../../step/plan/rolling-step-policy-policy.js";
import { RollingEnrollmentWindow, newRollingEnrollmentWindow } from "./rolling-enrollment-window.js";

export function summarizeDefaultStepBundlesForWindow(items: DefaultStepBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRollingEnrollmentWindowsFromBundle(items: DefaultStepBundle[]): RollingEnrollmentWindow[] {
  const out: RollingEnrollmentWindow[] = [];
  for (const item of items) {
    const derived = newRollingEnrollmentWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreRollingEnrollmentWindow(item: RollingEnrollmentWindow): string {
  return rollingStepPolicyBucket(item.effectiveExposure());
}
