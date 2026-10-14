import { normalizeCreativePlanCode } from "../../creative/estimate/creative-plan-policy.js";
import { PendingCreativeForecast } from "../../creative/estimate/pending-creative-forecast.js";
import { WeightedFrequencySlot, newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

export function summarizePendingCreativeForecastsForSlot(items: PendingCreativeForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWeightedFrequencySlotsFromForecast(items: PendingCreativeForecast[]): WeightedFrequencySlot[] {
  const out: WeightedFrequencySlot[] = [];
  for (const item of items) {
    const derived = newWeightedFrequencySlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeWeightedFrequencySlotExtra(item: WeightedFrequencySlot): string {
  return normalizeCreativePlanCode(item.code);
}
