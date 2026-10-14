import { frequencyBaselineBucket } from "../../frequency/baseline/frequency-baseline-policy.js";
import { FrequencyCycle } from "../../frequency/baseline/frequency-cycle.js";
import { PlacementVariance, newPlacementVariance } from "./placement-variance.js";

export function summarizeFrequencyCyclesForVariance(items: FrequencyCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePlacementVariancesFromCycle(items: FrequencyCycle[]): PlacementVariance[] {
  const out: PlacementVariance[] = [];
  for (const item of items) {
    const derived = newPlacementVariance(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimatePlacementVariance(item: PlacementVariance): string {
  return frequencyBaselineBucket(item.effectiveExposure());
}
