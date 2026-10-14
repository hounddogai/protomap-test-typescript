import { EnrollmentException } from "../../enrollment/default-enrollment-digest/enrollment-exception.js";
import { classifyEnrollmentMetric } from "../../enrollment/default-enrollment-digest/enrollment-metric-policy.js";
import { RollingBranchVariance, newRollingBranchVariance } from "./rolling-branch-variance.js";

export function summarizeEnrollmentExceptionsForVariance(items: EnrollmentException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRollingBranchVariancesFromException(items: EnrollmentException[]): RollingBranchVariance[] {
  const out: RollingBranchVariance[] = [];
  for (const item of items) {
    const derived = newRollingBranchVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyRollingBranchVariance(item: RollingBranchVariance): string {
  return classifyEnrollmentMetric(item.netExposure());
}
