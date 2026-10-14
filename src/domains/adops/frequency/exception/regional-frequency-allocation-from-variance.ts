import { manualPacingVarianceBucket } from "../../pacing/estimate/manual-pacing-variance-policy.js";
import { ManualPacingVariance } from "../../pacing/estimate/manual-pacing-variance.js";
import { RegionalFrequencyAllocation, newRegionalFrequencyAllocation } from "./regional-frequency-allocation.js";

export function summarizeManualPacingVariancesForAllocation(items: ManualPacingVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRegionalFrequencyAllocationsFromVariance(items: ManualPacingVariance[]): RegionalFrequencyAllocation[] {
  const out: RegionalFrequencyAllocation[] = [];
  for (const item of items) {
    const derived = newRegionalFrequencyAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRegionalFrequencyAllocation(item: RegionalFrequencyAllocation): string {
  return manualPacingVarianceBucket(item.netLoad());
}
