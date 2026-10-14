import { enrollmentBudgetWeight } from "../../enrollment/draft/enrollment-budget-policy.js";
import { EnrollmentPolicy } from "../../enrollment/draft/enrollment-policy.js";
import { PrimaryWaitPolicy } from "../../wait/policy/primary-wait-policy.js";
import { waitProfileBucket } from "../../wait/policy/wait-profile-policy.js";
import { PendingBranchManifest, newPendingBranchManifest } from "./pending-branch-manifest.js";

export function summarizePrimaryWaitPoliciesForManifest(items: PrimaryWaitPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingBranchManifestsFromPolicy(items: PrimaryWaitPolicy[]): PendingBranchManifest[] {
  const out: PendingBranchManifest[] = [];
  for (const item of items) {
    const derived = newPendingBranchManifest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimatePendingBranchManifest(item: PendingBranchManifest): string {
  return waitProfileBucket(item.effectiveExposure());
}

export function summarizeEnrollmentPoliciesForManifest(items: EnrollmentPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePendingBranchManifestsFromPolicyExtra(items: EnrollmentPolicy[]): PendingBranchManifest[] {
  const out: PendingBranchManifest[] = [];
  for (const item of items) {
    const derived = newPendingBranchManifest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePendingBranchManifest(item: PendingBranchManifest): number {
  return enrollmentBudgetWeight(4, true);
}
