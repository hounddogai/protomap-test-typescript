import { PendingSuppressionForecast } from "../../suppression/notice/pending-suppression-forecast.js";
import { normalizeSuppressionScoreCode } from "../../suppression/notice/suppression-score-policy.js";
import { WeightedPreferenceMapping, newWeightedPreferenceMapping } from "./weighted-preference-mapping.js";

export function summarizePendingSuppressionForecastsForMapping(items: PendingSuppressionForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedPreferenceMappingsFromForecast(items: PendingSuppressionForecast[]): WeightedPreferenceMapping[] {
  const out: WeightedPreferenceMapping[] = [];
  for (const item of items) {
    const derived = newWeightedPreferenceMapping(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveWeightedPreferenceMapping(item: WeightedPreferenceMapping): string {
  return normalizeSuppressionScoreCode(item.code);
}
