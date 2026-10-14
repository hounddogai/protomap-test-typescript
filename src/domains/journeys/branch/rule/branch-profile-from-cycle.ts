import {
  classifyStrictEnrollmentDigest,
} from "../../enrollment/enrollment-digest/strict-enrollment-digest-policy.js";
import { WeightedEnrollmentCycle } from "../../enrollment/enrollment-digest/weighted-enrollment-cycle.js";
import { BranchProfile, newBranchProfile } from "./branch-profile.js";

export function summarizeWeightedEnrollmentCyclesForProfile(items: WeightedEnrollmentCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveBranchProfilesFromCycle(items: WeightedEnrollmentCycle[]): BranchProfile[] {
  const out: BranchProfile[] = [];
  for (const item of items) {
    const derived = newBranchProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleBranchProfile(item: BranchProfile): string {
  return classifyStrictEnrollmentDigest(item.effectiveTotal());
}
