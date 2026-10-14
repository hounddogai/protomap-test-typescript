import { cappedOptOutAssignmentWeight } from "../../opt-out/assignment/capped-opt-out-assignment-policy.js";
import { CappedOptOutAssignment } from "../../opt-out/assignment/capped-opt-out-assignment.js";
import { ProofRequest, newProofRequest } from "./proof-request.js";

export function summarizeCappedOptOutAssignmentsForRequest(items: CappedOptOutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveProofRequestsFromAssignment(items: CappedOptOutAssignment[]): ProofRequest[] {
  const out: ProofRequest[] = [];
  for (const item of items) {
    const derived = newProofRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateProofRequest(item: ProofRequest): number {
  return cappedOptOutAssignmentWeight(4, true);
}
