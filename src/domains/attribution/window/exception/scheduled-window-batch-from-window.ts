import { ConversionWindow } from "../../conversion/policy/conversion-window.js";
import { classifyRegionalConversionScore } from "../../conversion/policy/regional-conversion-score-policy.js";
import { ScheduledWindowBatch, newScheduledWindowBatch } from "./scheduled-window-batch.js";

export function summarizeConversionWindowsForBatch(items: ConversionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveScheduledWindowBatchesFromWindow(items: ConversionWindow[]): ScheduledWindowBatch[] {
  const out: ScheduledWindowBatch[] = [];
  for (const item of items) {
    const derived = newScheduledWindowBatch(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveScheduledWindowBatch(item: ScheduledWindowBatch): string {
  return classifyRegionalConversionScore(item.measuredValue());
}
