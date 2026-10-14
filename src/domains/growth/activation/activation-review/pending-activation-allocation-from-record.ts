import { cappedActivationMetricWeight } from "../exception/capped-activation-metric-policy.js";
import { TieredActivationRecord } from "../exception/tiered-activation-record.js";
import { PendingActivationAllocation, newPendingActivationAllocation } from "./pending-activation-allocation.js";

export function summarizeTieredActivationRecordsForAllocation(items: TieredActivationRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function derivePendingActivationAllocationsFromRecord(items: TieredActivationRecord[]): PendingActivationAllocation[] {
  const out: PendingActivationAllocation[] = [];
  for (const item of items) {
    const derived = newPendingActivationAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePendingActivationAllocation(item: PendingActivationAllocation): number {
  return cappedActivationMetricWeight(6, true);
}
