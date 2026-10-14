import { classifyGlobalStepProfile } from "../../step/claim/global-step-profile-policy.js";
import { StepClaim } from "../../step/claim/step-claim.js";
import { BatchedBranchNotice, newBatchedBranchNotice } from "./batched-branch-notice.js";

export function summarizeStepClaimsForNotice(items: StepClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBatchedBranchNoticesFromClaim(items: StepClaim[]): BatchedBranchNotice[] {
  const out: BatchedBranchNotice[] = [];
  for (const item of items) {
    const derived = newBatchedBranchNotice(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeBatchedBranchNotice(item: BatchedBranchNotice): string {
  return classifyGlobalStepProfile(item.netExposure());
}
