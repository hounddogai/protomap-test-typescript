import { batchedInsightScoreBucket } from "../score/batched-insight-score-policy.js";
import { SeasonalInsightBatch } from "../score/seasonal-insight-batch.js";
import { LegacyInsightForecast, newLegacyInsightForecast } from "./legacy-insight-forecast.js";

export function summarizeSeasonalInsightBatchesForForecast(items: SeasonalInsightBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveLegacyInsightForecastsFromBatch(items: SeasonalInsightBatch[]): LegacyInsightForecast[] {
  const out: LegacyInsightForecast[] = [];
  for (const item of items) {
    const derived = newLegacyInsightForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyInsightForecast(item: LegacyInsightForecast): string {
  return batchedInsightScoreBucket(item.weightedVolume());
}
