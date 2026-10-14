import { CreditAssignment } from "../credit-notice/credit-assignment.js";
import { regionalCreditRequestWeight } from "../credit-notice/regional-credit-request-policy.js";
import { FallbackCreditBudget, newFallbackCreditBudget } from "./fallback-credit-budget.js";

export function summarizeCreditAssignmentsForBudget(items: CreditAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFallbackCreditBudgetsFromAssignment(items: CreditAssignment[]): FallbackCreditBudget[] {
  const out: FallbackCreditBudget[] = [];
  for (const item of items) {
    const derived = newFallbackCreditBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectFallbackCreditBudget(item: FallbackCreditBudget): number {
  return regionalCreditRequestWeight(8, true);
}
