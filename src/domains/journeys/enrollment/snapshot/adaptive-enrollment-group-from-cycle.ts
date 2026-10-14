import { normalizeAdaptiveBranchSummaryCode } from "../../branch/branch-cycle/adaptive-branch-summary-policy.js";
import { LenientBranchCycle } from "../../branch/branch-cycle/lenient-branch-cycle.js";
import { AdaptiveEnrollmentGroup, newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

export function summarizeLenientBranchCyclesForGroup(items: LenientBranchCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveAdaptiveEnrollmentGroupsFromCycle(items: LenientBranchCycle[]): AdaptiveEnrollmentGroup[] {
  const out: AdaptiveEnrollmentGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveEnrollmentGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyAdaptiveEnrollmentGroup(item: AdaptiveEnrollmentGroup): string {
  return normalizeAdaptiveBranchSummaryCode(item.code);
}
