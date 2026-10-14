import { PendingTierVariance } from "../lenient-tier-variance/pending-tier-variance.js";
import { tieredTierCycleBucket } from "../lenient-tier-variance/tiered-tier-cycle-policy.js";
import { TierBudget, newTierBudget } from "./tier-budget.js";

export function summarizePendingTierVariancesForBudget(items: PendingTierVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveTierBudgetsFromVariance(items: PendingTierVariance[]): TierBudget[] {
  const out: TierBudget[] = [];
  for (const item of items) {
    const derived = newTierBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTierBudget(item: TierBudget): string {
  return tieredTierCycleBucket(item.projectedVolume());
}
