import { pendingLevelCycleWeight } from "../../level/level-cycle/pending-level-cycle-policy.js";
import { PendingLevelCycle } from "../../level/level-cycle/pending-level-cycle.js";
import { PendingRewardMetric, newPendingRewardMetric } from "./pending-reward-metric.js";

export function summarizePendingLevelCyclesForMetric(items: PendingLevelCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePendingRewardMetricsFromCycle(items: PendingLevelCycle[]): PendingRewardMetric[] {
  const out: PendingRewardMetric[] = [];
  for (const item of items) {
    const derived = newPendingRewardMetric(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingRewardMetric(item: PendingRewardMetric): number {
  return pendingLevelCycleWeight(7, true);
}
