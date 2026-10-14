import { defaultExitRuleClaimWeight } from "../../exit-rule/cycle/default-exit-rule-claim-policy.js";
import { FallbackExitRuleCycle } from "../../exit-rule/cycle/fallback-exit-rule-cycle.js";
import { GlobalWaitBudget, newGlobalWaitBudget } from "./global-wait-budget.js";

export function summarizeFallbackExitRuleCyclesForBudget(items: FallbackExitRuleCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveGlobalWaitBudgetsFromCycle(items: FallbackExitRuleCycle[]): GlobalWaitBudget[] {
  const out: GlobalWaitBudget[] = [];
  for (const item of items) {
    const derived = newGlobalWaitBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveGlobalWaitBudget(item: GlobalWaitBudget): number {
  return defaultExitRuleClaimWeight(4, true);
}
