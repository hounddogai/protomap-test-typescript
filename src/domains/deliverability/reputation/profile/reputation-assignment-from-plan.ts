import { normalizeSenderPlanCode } from "../../sender/agreement/sender-plan-policy.js";
import { SenderPlan } from "../../sender/agreement/sender-plan.js";
import { ReputationAssignment, newReputationAssignment } from "./reputation-assignment.js";

export function summarizeSenderPlansForAssignment(items: SenderPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReputationAssignmentsFromPlan(items: SenderPlan[]): ReputationAssignment[] {
  const out: ReputationAssignment[] = [];
  for (const item of items) {
    const derived = newReputationAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleReputationAssignment(item: ReputationAssignment): string {
  return normalizeSenderPlanCode(item.code);
}
