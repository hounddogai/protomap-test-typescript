import { AdaptiveLevelForecast } from "../profile/adaptive-level-forecast.js";
import { levelBatchWeight } from "../profile/level-batch-policy.js";
import { LevelSummary, newLevelSummary } from "./level-summary.js";

export function summarizeAdaptiveLevelForecastsForSummary(items: AdaptiveLevelForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveLevelSummariesFromForecast(items: AdaptiveLevelForecast[]): LevelSummary[] {
  const out: LevelSummary[] = [];
  for (const item of items) {
    const derived = newLevelSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLevelSummary(item: LevelSummary): number {
  return levelBatchWeight(8, true);
}
