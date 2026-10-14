import { classifyCreditRule } from "../agreement/credit-rule-policy.js";
import { CreditRule } from "../agreement/credit-rule.js";
import { GlobalCreditAllocation, newGlobalCreditAllocation } from "./global-credit-allocation.js";

export function summarizeCreditRulesForAllocation(items: CreditRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalCreditAllocationsFromRule(items: CreditRule[]): GlobalCreditAllocation[] {
  const out: GlobalCreditAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalCreditAllocation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceGlobalCreditAllocation(item: GlobalCreditAllocation): string {
  return classifyCreditRule(item.weightedLoad());
}
