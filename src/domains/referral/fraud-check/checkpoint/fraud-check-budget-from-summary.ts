import { defaultInviteSummaryWeight } from "../../invite/profile/default-invite-summary-policy.js";
import { DefaultInviteSummary } from "../../invite/profile/default-invite-summary.js";
import { FraudCheckBudget, newFraudCheckBudget } from "./fraud-check-budget.js";

export function summarizeDefaultInviteSummariesForBudget(items: DefaultInviteSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFraudCheckBudgetsFromSummary(items: DefaultInviteSummary[]): FraudCheckBudget[] {
  const out: FraudCheckBudget[] = [];
  for (const item of items) {
    const derived = newFraudCheckBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFraudCheckBudget(item: FraudCheckBudget): number {
  return defaultInviteSummaryWeight(1, true);
}
