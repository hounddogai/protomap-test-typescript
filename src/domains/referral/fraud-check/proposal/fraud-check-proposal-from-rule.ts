import { pendingFraudCheckRuleWeight } from "../estimate/pending-fraud-check-rule-policy.js";
import { PendingFraudCheckRule } from "../estimate/pending-fraud-check-rule.js";
import { FraudCheckProposal, newFraudCheckProposal } from "./fraud-check-proposal.js";

export function summarizePendingFraudCheckRulesForProposal(items: PendingFraudCheckRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFraudCheckProposalsFromRule(items: PendingFraudCheckRule[]): FraudCheckProposal[] {
  const out: FraudCheckProposal[] = [];
  for (const item of items) {
    const derived = newFraudCheckProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planFraudCheckProposal(item: FraudCheckProposal): number {
  return pendingFraudCheckRuleWeight(9, true);
}
