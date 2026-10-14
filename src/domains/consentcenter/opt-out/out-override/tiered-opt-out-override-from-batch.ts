import { regionalOptOutQuotaWeight } from "../batch/regional-opt-out-quota-policy.js";
import { StrictOptOutBatch } from "../batch/strict-opt-out-batch.js";
import { TieredOptOutOverride, newTieredOptOutOverride } from "./tiered-opt-out-override.js";

export function summarizeStrictOptOutBatchesForOverride(items: StrictOptOutBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveTieredOptOutOverridesFromBatch(items: StrictOptOutBatch[]): TieredOptOutOverride[] {
  const out: TieredOptOutOverride[] = [];
  for (const item of items) {
    const derived = newTieredOptOutOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTieredOptOutOverride(item: TieredOptOutOverride): number {
  return regionalOptOutQuotaWeight(2, true);
}
