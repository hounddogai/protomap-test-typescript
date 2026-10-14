import { EnrollmentAgreement } from "../../enrollment/agreement/enrollment-agreement.js";
import { classifyPendingEnrollmentPolicy } from "../../enrollment/agreement/pending-enrollment-policy-policy.js";
import { PendingBranchDigest, newPendingBranchDigest } from "./pending-branch-digest.js";

export function summarizeEnrollmentAgreementsForDigest(items: EnrollmentAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePendingBranchDigestsFromAgreement(items: EnrollmentAgreement[]): PendingBranchDigest[] {
  const out: PendingBranchDigest[] = [];
  for (const item of items) {
    const derived = newPendingBranchDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePendingBranchDigest(item: PendingBranchDigest): string {
  return classifyPendingEnrollmentPolicy(item.netVolume());
}
