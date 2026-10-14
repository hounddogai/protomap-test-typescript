import { manualPostForecastBucket } from "../../post/rollup/manual-post-forecast-policy.js";
import { ManualPostForecast } from "../../post/rollup/manual-post-forecast.js";
import { AdaptiveMentionAllocation, newAdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

export function summarizeManualPostForecastsForAllocation(items: ManualPostForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveAdaptiveMentionAllocationsFromForecast(items: ManualPostForecast[]): AdaptiveMentionAllocation[] {
  const out: AdaptiveMentionAllocation[] = [];
  for (const item of items) {
    const derived = newAdaptiveMentionAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveMentionAllocation(item: AdaptiveMentionAllocation): string {
  return manualPostForecastBucket(item.netValue());
}
