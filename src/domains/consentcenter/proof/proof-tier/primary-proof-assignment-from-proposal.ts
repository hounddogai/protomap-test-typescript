import { batchedDoubleOptInReviewBucket } from "../../double-opt-in/in-review/batched-double-opt-in-review-policy.js";
import { DoubleOptInProposal } from "../../double-opt-in/in-review/double-opt-in-proposal.js";
import { PrimaryProofAssignment, newPrimaryProofAssignment } from "./primary-proof-assignment.js";

export function summarizeDoubleOptInProposalsForAssignment(items: DoubleOptInProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePrimaryProofAssignmentsFromProposal(items: DoubleOptInProposal[]): PrimaryProofAssignment[] {
  const out: PrimaryProofAssignment[] = [];
  for (const item of items) {
    const derived = newPrimaryProofAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePrimaryProofAssignment(item: PrimaryProofAssignment): string {
  return batchedDoubleOptInReviewBucket(item.measuredValue());
}
