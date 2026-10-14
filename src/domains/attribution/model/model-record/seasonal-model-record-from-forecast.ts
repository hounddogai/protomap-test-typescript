import { AdaptiveTouchpointForecast } from "../../touchpoint/adjustment/adaptive-touchpoint-forecast.js";
import { classifyTouchpointAdjustment } from "../../touchpoint/adjustment/touchpoint-adjustment-policy.js";
import { SeasonalModelRecord, newSeasonalModelRecord } from "./seasonal-model-record.js";

export function summarizeAdaptiveTouchpointForecastsForRecord(items: AdaptiveTouchpointForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSeasonalModelRecordsFromForecast(items: AdaptiveTouchpointForecast[]): SeasonalModelRecord[] {
  const out: SeasonalModelRecord[] = [];
  for (const item of items) {
    const derived = newSeasonalModelRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectSeasonalModelRecord(item: SeasonalModelRecord): string {
  return classifyTouchpointAdjustment(item.adjustedExposure());
}
