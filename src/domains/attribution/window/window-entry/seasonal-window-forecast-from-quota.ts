import { AdaptiveConversionQuota } from "../../conversion/conversion-record/adaptive-conversion-quota.js";
import {
  normalizeTieredConversionRecordCode,
} from "../../conversion/conversion-record/tiered-conversion-record-policy.js";
import { SeasonalWindowForecast, newSeasonalWindowForecast } from "./seasonal-window-forecast.js";

export function summarizeAdaptiveConversionQuotasForForecast(items: AdaptiveConversionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveSeasonalWindowForecastsFromQuota(items: AdaptiveConversionQuota[]): SeasonalWindowForecast[] {
  const out: SeasonalWindowForecast[] = [];
  for (const item of items) {
    const derived = newSeasonalWindowForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreSeasonalWindowForecast(item: SeasonalWindowForecast): string {
  return normalizeTieredConversionRecordCode(item.code);
}
