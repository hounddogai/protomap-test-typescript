import { ManualConversionPolicy } from "../conversion-rollup/manual-conversion-policy.js";
import { scheduledConversionRollupWeight } from "../conversion-rollup/scheduled-conversion-rollup-policy.js";
import { BatchedConversionBundle, newBatchedConversionBundle } from "./batched-conversion-bundle.js";

export function summarizeManualConversionPoliciesForBundle(items: ManualConversionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedConversionBundlesFromPolicy(items: ManualConversionPolicy[]): BatchedConversionBundle[] {
  const out: BatchedConversionBundle[] = [];
  for (const item of items) {
    const derived = newBatchedConversionBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedConversionBundle(item: BatchedConversionBundle): number {
  return scheduledConversionRollupWeight(5, true);
}
