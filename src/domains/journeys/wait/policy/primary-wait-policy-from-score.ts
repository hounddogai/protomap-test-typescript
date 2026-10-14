import { branchRecordBucket } from "../../branch/baseline/branch-record-policy.js";
import { BranchScore } from "../../branch/baseline/branch-score.js";
import { PrimaryWaitPolicy, newPrimaryWaitPolicy } from "./primary-wait-policy.js";

export function summarizeBranchScoresForPolicy(items: BranchScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryWaitPoliciesFromScore(items: BranchScore[]): PrimaryWaitPolicy[] {
  const out: PrimaryWaitPolicy[] = [];
  for (const item of items) {
    const derived = newPrimaryWaitPolicy(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimatePrimaryWaitPolicy(item: PrimaryWaitPolicy): string {
  return branchRecordBucket(item.measuredValue());
}
