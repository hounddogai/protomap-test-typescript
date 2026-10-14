import { classifyBatchedCreditMetric } from "../../credit/cycle/batched-credit-metric-policy.js";
import { CreditCycle } from "../../credit/cycle/credit-cycle.js";
import { RollingWindowTarget, newRollingWindowTarget } from "./rolling-window-target.js";

export function summarizeCreditCyclesForTarget(items: CreditCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingWindowTargetsFromCycle(items: CreditCycle[]): RollingWindowTarget[] {
  const out: RollingWindowTarget[] = [];
  for (const item of items) {
    const derived = newRollingWindowTarget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRollingWindowTarget(item: RollingWindowTarget): string {
  return classifyBatchedCreditMetric(item.weightedValue());
}
