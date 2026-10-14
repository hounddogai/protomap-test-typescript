import { normalizePendingProofAgreementCode } from "../../proof/agreement/pending-proof-agreement-policy.js";
import { PendingProofAgreement } from "../../proof/agreement/pending-proof-agreement.js";
import { PendingOptOutAssignment, newPendingOptOutAssignment } from "./pending-opt-out-assignment.js";

export function summarizePendingProofAgreementsForAssignment(items: PendingProofAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingOptOutAssignmentsFromAgreement(items: PendingProofAgreement[]): PendingOptOutAssignment[] {
  const out: PendingOptOutAssignment[] = [];
  for (const item of items) {
    const derived = newPendingOptOutAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePendingOptOutAssignment(item: PendingOptOutAssignment): string {
  return normalizePendingProofAgreementCode(item.code);
}
