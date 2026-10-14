import {
  cappedSuppressionProposalBucket,
} from "../../suppression/suppression-proposal/capped-suppression-proposal-policy.js";
import { SuppressionQuota } from "../../suppression/suppression-proposal/suppression-quota.js";
import { ProofBudget, newProofBudget } from "./proof-budget.js";

export function summarizeSuppressionQuotasForBudget(items: SuppressionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveProofBudgetsFromQuota(items: SuppressionQuota[]): ProofBudget[] {
  const out: ProofBudget[] = [];
  for (const item of items) {
    const derived = newProofBudget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileProofBudget(item: ProofBudget): string {
  return cappedSuppressionProposalBucket(item.measuredValue());
}
