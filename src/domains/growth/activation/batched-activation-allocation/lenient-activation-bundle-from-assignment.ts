import { cohortBudgetWeight } from "../../cohort/variance/cohort-budget-policy.js";
import { StrictCohortAssignment } from "../../cohort/variance/strict-cohort-assignment.js";
import { LenientActivationBundle, newLenientActivationBundle } from "./lenient-activation-bundle.js";

export function summarizeStrictCohortAssignmentsForBundle(items: StrictCohortAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveLenientActivationBundlesFromAssignment(items: StrictCohortAssignment[]): LenientActivationBundle[] {
  const out: LenientActivationBundle[] = [];
  for (const item of items) {
    const derived = newLenientActivationBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLenientActivationBundle(item: LenientActivationBundle): number {
  return cohortBudgetWeight(5, true);
}
