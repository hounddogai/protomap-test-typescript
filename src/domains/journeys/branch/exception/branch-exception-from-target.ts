import { EnrollmentTarget } from "../../enrollment/override-item/enrollment-target.js";
import {
  normalizeTieredEnrollmentScheduleCode,
} from "../../enrollment/override-item/tiered-enrollment-schedule-policy.js";
import { BranchException, newBranchException } from "./branch-exception.js";

export function summarizeEnrollmentTargetsForException(items: EnrollmentTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBranchExceptionsFromTarget(items: EnrollmentTarget[]): BranchException[] {
  const out: BranchException[] = [];
  for (const item of items) {
    const derived = newBranchException(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankBranchException(item: BranchException): string {
  return normalizeTieredEnrollmentScheduleCode(item.code);
}
