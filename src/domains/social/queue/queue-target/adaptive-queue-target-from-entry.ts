import { classifyLegacyInsightForecast } from "../../insight/entry/legacy-insight-forecast-policy.js";
import { WeightedInsightEntry } from "../../insight/entry/weighted-insight-entry.js";
import { AdaptiveQueueTarget, newAdaptiveQueueTarget } from "./adaptive-queue-target.js";

export function summarizeWeightedInsightEntriesForTarget(items: WeightedInsightEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveAdaptiveQueueTargetsFromEntry(items: WeightedInsightEntry[]): AdaptiveQueueTarget[] {
  const out: AdaptiveQueueTarget[] = [];
  for (const item of items) {
    const derived = newAdaptiveQueueTarget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveQueueTarget(item: AdaptiveQueueTarget): string {
  return classifyLegacyInsightForecast(item.weightedValue());
}
