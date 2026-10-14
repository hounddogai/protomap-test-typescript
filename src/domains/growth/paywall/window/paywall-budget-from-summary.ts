import { classifyNudgeProposal } from "../../nudge/summary/nudge-proposal-policy.js";
import { NudgeSummary } from "../../nudge/summary/nudge-summary.js";
import { PaywallBudget, newPaywallBudget } from "./paywall-budget.js";

export function summarizeNudgeSummariesForBudget(items: NudgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePaywallBudgetsFromSummary(items: NudgeSummary[]): PaywallBudget[] {
  const out: PaywallBudget[] = [];
  for (const item of items) {
    const derived = newPaywallBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPaywallBudget(item: PaywallBudget): string {
  return classifyNudgeProposal(item.projectedTotal());
}
