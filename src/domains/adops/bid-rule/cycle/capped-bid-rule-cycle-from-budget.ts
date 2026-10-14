import { rollingFlightBudgetBucket } from "../../flight/flight-record/rolling-flight-budget-policy.js";
import { RollingFlightBudget } from "../../flight/flight-record/rolling-flight-budget.js";
import { CappedBidRuleCycle, newCappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

export function summarizeRollingFlightBudgetsForCycle(items: RollingFlightBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedBidRuleCyclesFromBudget(items: RollingFlightBudget[]): CappedBidRuleCycle[] {
  const out: CappedBidRuleCycle[] = [];
  for (const item of items) {
    const derived = newCappedBidRuleCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyCappedBidRuleCycle(item: CappedBidRuleCycle): string {
  return rollingFlightBudgetBucket(item.netVolume());
}
