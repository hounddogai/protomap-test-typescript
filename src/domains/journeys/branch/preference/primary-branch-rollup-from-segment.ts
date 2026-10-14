import {
  classifyAdaptiveEnrollmentBaseline,
} from "../../enrollment/adaptive-enrollment-digest/adaptive-enrollment-baseline-policy.js";
import { EnrollmentSegment } from "../../enrollment/adaptive-enrollment-digest/enrollment-segment.js";
import { PrimaryBranchRollup, newPrimaryBranchRollup } from "./primary-branch-rollup.js";

export function summarizeEnrollmentSegmentsForRollup(items: EnrollmentSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePrimaryBranchRollupsFromSegment(items: EnrollmentSegment[]): PrimaryBranchRollup[] {
  const out: PrimaryBranchRollup[] = [];
  for (const item of items) {
    const derived = newPrimaryBranchRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryBranchRollup(item: PrimaryBranchRollup): string {
  return classifyAdaptiveEnrollmentBaseline(item.weightedLoad());
}
