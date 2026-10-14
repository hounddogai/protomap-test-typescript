import { CappedWaitDigest } from "../../wait/digest/capped-wait-digest.js";
import { normalizeWaitReservationCode } from "../../wait/digest/wait-reservation-policy.js";
import { ExitRuleBudget, newExitRuleBudget } from "./exit-rule-budget.js";

export function summarizeCappedWaitDigestsForBudget(items: CappedWaitDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveExitRuleBudgetsFromDigest(items: CappedWaitDigest[]): ExitRuleBudget[] {
  const out: ExitRuleBudget[] = [];
  for (const item of items) {
    const derived = newExitRuleBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateExitRuleBudget(item: ExitRuleBudget): string {
  return normalizeWaitReservationCode(item.code);
}
