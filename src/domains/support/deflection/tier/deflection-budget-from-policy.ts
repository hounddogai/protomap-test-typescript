import { CsatPolicy } from "../../csat/preference/csat-policy.js";
import { csatPreferenceBucket } from "../../csat/preference/csat-preference-policy.js";
import { DeflectionBudget, newDeflectionBudget } from "./deflection-budget.js";

export function summarizeCsatPoliciesForBudget(items: CsatPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveDeflectionBudgetsFromPolicy(items: CsatPolicy[]): DeflectionBudget[] {
  const out: DeflectionBudget[] = [];
  for (const item of items) {
    const derived = newDeflectionBudget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateDeflectionBudget(item: DeflectionBudget): string {
  return csatPreferenceBucket(item.projectedLoad());
}
