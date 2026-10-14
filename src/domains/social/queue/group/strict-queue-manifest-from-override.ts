import { normalizeSeasonalInsightBatchCode } from "../../insight/score/seasonal-insight-batch-policy.js";
import { WeightedInsightOverride } from "../../insight/score/weighted-insight-override.js";
import { StrictQueueManifest, newStrictQueueManifest } from "./strict-queue-manifest.js";

export function summarizeWeightedInsightOverridesForManifest(items: WeightedInsightOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictQueueManifestsFromOverride(items: WeightedInsightOverride[]): StrictQueueManifest[] {
  const out: StrictQueueManifest[] = [];
  for (const item of items) {
    const derived = newStrictQueueManifest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planStrictQueueManifest(item: StrictQueueManifest): string {
  return normalizeSeasonalInsightBatchCode(item.code);
}
