import { FallbackStreakBundle } from "../exception/fallback-streak-bundle.js";
import { classifyManualStreakException } from "../exception/manual-streak-exception-policy.js";
import { WeightedStreakSummary, newWeightedStreakSummary } from "./weighted-streak-summary.js";

export function summarizeFallbackStreakBundlesForSummary(items: FallbackStreakBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveWeightedStreakSummariesFromBundle(items: FallbackStreakBundle[]): WeightedStreakSummary[] {
  const out: WeightedStreakSummary[] = [];
  for (const item of items) {
    const derived = newWeightedStreakSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeWeightedStreakSummary(item: WeightedStreakSummary): string {
  return classifyManualStreakException(item.effectiveExposure());
}
