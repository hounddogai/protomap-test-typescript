import { BranchAgreement } from "../../branch/exception/branch-agreement.js";
import { branchExceptionBucket } from "../../branch/exception/branch-exception-policy.js";
import { WeightedExitRuleDigest, newWeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

export function summarizeBranchAgreementsForDigest(items: BranchAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedExitRuleDigestsFromAgreement(items: BranchAgreement[]): WeightedExitRuleDigest[] {
  const out: WeightedExitRuleDigest[] = [];
  for (const item of items) {
    const derived = newWeightedExitRuleDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedExitRuleDigest(item: WeightedExitRuleDigest): string {
  return branchExceptionBucket(item.projectedExposure());
}
