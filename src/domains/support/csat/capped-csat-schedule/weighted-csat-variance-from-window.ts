import { normalizeRollingSlaTierCode } from "../../sla/window/rolling-sla-tier-policy.js";
import { RollingSlaWindow } from "../../sla/window/rolling-sla-window.js";
import { WeightedCsatVariance, newWeightedCsatVariance } from "./weighted-csat-variance.js";

export function summarizeRollingSlaWindowsForVariance(items: RollingSlaWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedCsatVariancesFromWindow(items: RollingSlaWindow[]): WeightedCsatVariance[] {
  const out: WeightedCsatVariance[] = [];
  for (const item of items) {
    const derived = newWeightedCsatVariance(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveWeightedCsatVariance(item: WeightedCsatVariance): string {
  return normalizeRollingSlaTierCode(item.code);
}
