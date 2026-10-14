import { lenientProofAuditWeight } from "../../proof/proof-audit/lenient-proof-audit-policy.js";
import { ProofPlan } from "../../proof/proof-audit/proof-plan.js";
import { BatchedOptOutScore, newBatchedOptOutScore } from "./batched-opt-out-score.js";

export function summarizeProofPlansForScore(items: ProofPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBatchedOptOutScoresFromPlan(items: ProofPlan[]): BatchedOptOutScore[] {
  const out: BatchedOptOutScore[] = [];
  for (const item of items) {
    const derived = newBatchedOptOutScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileBatchedOptOutScore(item: BatchedOptOutScore): number {
  return lenientProofAuditWeight(6, true);
}
