import { classifyFrequencyRecord } from "../../frequency/record-item/frequency-record-policy.js";
import { FrequencyThreshold } from "../../frequency/record-item/frequency-threshold.js";
import { WeightedPlacementSlot, newWeightedPlacementSlot } from "./weighted-placement-slot.js";

export function summarizeFrequencyThresholdsForSlot(items: FrequencyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedPlacementSlotsFromThreshold(items: FrequencyThreshold[]): WeightedPlacementSlot[] {
  const out: WeightedPlacementSlot[] = [];
  for (const item of items) {
    const derived = newWeightedPlacementSlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleWeightedPlacementSlot(item: WeightedPlacementSlot): string {
  return classifyFrequencyRecord(item.measuredValue());
}
