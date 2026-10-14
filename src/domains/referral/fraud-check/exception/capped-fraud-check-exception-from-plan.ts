import { PendingRewardRulePlan } from "../../reward-rule/ledger/pending-reward-rule-plan.js";
import { classifyScheduledRewardRulePolicy } from "../../reward-rule/ledger/scheduled-reward-rule-policy-policy.js";
import { CappedFraudCheckException, newCappedFraudCheckException } from "./capped-fraud-check-exception.js";

export function summarizePendingRewardRulePlansForException(items: PendingRewardRulePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedFraudCheckExceptionsFromPlan(items: PendingRewardRulePlan[]): CappedFraudCheckException[] {
  const out: CappedFraudCheckException[] = [];
  for (const item of items) {
    const derived = newCappedFraudCheckException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeCappedFraudCheckException(item: CappedFraudCheckException): string {
  return classifyScheduledRewardRulePolicy(item.weightedTotal());
}
