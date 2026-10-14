import { FrequencyEstimate } from "../estimate/frequency-estimate.js";
import { classifyGlobalFrequencyClaim } from "../estimate/global-frequency-claim-policy.js";
import { WeightedFrequencySlot, newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

export function summarizeFrequencyEstimatesForSlot(items: FrequencyEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveWeightedFrequencySlotsFromEstimate(items: FrequencyEstimate[]): WeightedFrequencySlot[] {
  const out: WeightedFrequencySlot[] = [];
  for (const item of items) {
    const derived = newWeightedFrequencySlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeWeightedFrequencySlot(item: WeightedFrequencySlot): string {
  return classifyGlobalFrequencyClaim(item.projectedExposure());
}
