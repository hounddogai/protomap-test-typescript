import { branchAdjustmentWeight } from "../../branch/review/branch-adjustment-policy.js";
import { BranchClaim } from "../../branch/review/branch-claim.js";
import { StepPolicy, newStepPolicy } from "./step-policy.js";

export function summarizeBranchClaimsForPolicy(items: BranchClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStepPoliciesFromClaim(items: BranchClaim[]): StepPolicy[] {
  const out: StepPolicy[] = [];
  for (const item of items) {
    const derived = newStepPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStepPolicy(item: StepPolicy): number {
  return branchAdjustmentWeight(4, true);
}
