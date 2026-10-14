import { batchedCreditMetricWeight } from "../../credit/cycle/batched-credit-metric-policy.js";
import { CreditCycle } from "../../credit/cycle/credit-cycle.js";
import { PrimaryModelPlan, newPrimaryModelPlan } from "./primary-model-plan.js";

export function summarizeCreditCyclesForPlan(items: CreditCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryModelPlansFromCycle(items: CreditCycle[]): PrimaryModelPlan[] {
  const out: PrimaryModelPlan[] = [];
  for (const item of items) {
    const derived = newPrimaryModelPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryModelPlan(item: PrimaryModelPlan): number {
  return batchedCreditMetricWeight(5, true);
}
