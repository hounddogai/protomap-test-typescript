import { normalizeBatchedWaitPolicyCode } from "../../wait/wait-policy/batched-wait-policy-policy.js";
import { BatchedWaitPolicy } from "../../wait/wait-policy/batched-wait-policy.js";
import { GlobalBranchAssignment, newGlobalBranchAssignment } from "./global-branch-assignment.js";

export function summarizeBatchedWaitPoliciesForAssignment(items: BatchedWaitPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalBranchAssignmentsFromPolicy(items: BatchedWaitPolicy[]): GlobalBranchAssignment[] {
  const out: GlobalBranchAssignment[] = [];
  for (const item of items) {
    const derived = newGlobalBranchAssignment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectGlobalBranchAssignment(item: GlobalBranchAssignment): string {
  return normalizeBatchedWaitPolicyCode(item.code);
}
