import { FraudCheckBaseline } from "../../fraud-check/schedule/fraud-check-baseline.js";
import { fraudCheckScheduleWeight } from "../../fraud-check/schedule/fraud-check-schedule-policy.js";
import { PendingTierVariance, newPendingTierVariance } from "./pending-tier-variance.js";

export function summarizeFraudCheckBaselinesForVariance(items: FraudCheckBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePendingTierVariancesFromBaseline(items: FraudCheckBaseline[]): PendingTierVariance[] {
  const out: PendingTierVariance[] = [];
  for (const item of items) {
    const derived = newPendingTierVariance(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingTierVariance(item: PendingTierVariance): number {
  return fraudCheckScheduleWeight(4, true);
}
