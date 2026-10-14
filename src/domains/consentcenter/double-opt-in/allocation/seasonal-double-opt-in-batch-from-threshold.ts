import { classifySuppressionAdjustment } from "../../suppression/threshold/suppression-adjustment-policy.js";
import { SuppressionThreshold } from "../../suppression/threshold/suppression-threshold.js";
import { SeasonalDoubleOptInBatch, newSeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

export function summarizeSuppressionThresholdsForBatch(items: SuppressionThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveSeasonalDoubleOptInBatchesFromThreshold(items: SuppressionThreshold[]): SeasonalDoubleOptInBatch[] {
  const out: SeasonalDoubleOptInBatch[] = [];
  for (const item of items) {
    const derived = newSeasonalDoubleOptInBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalDoubleOptInBatch(item: SeasonalDoubleOptInBatch): string {
  return classifySuppressionAdjustment(item.weightedLoad());
}
