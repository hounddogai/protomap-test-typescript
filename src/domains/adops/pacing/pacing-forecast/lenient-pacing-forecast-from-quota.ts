import { FrequencyQuota } from "../../frequency/frequency-request/frequency-quota.js";
import {
  classifyLegacyFrequencyThreshold,
} from "../../frequency/frequency-request/legacy-frequency-threshold-policy.js";
import { LenientPacingForecast, newLenientPacingForecast } from "./lenient-pacing-forecast.js";

export function summarizeFrequencyQuotasForForecast(items: FrequencyQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLenientPacingForecastsFromQuota(items: FrequencyQuota[]): LenientPacingForecast[] {
  const out: LenientPacingForecast[] = [];
  for (const item of items) {
    const derived = newLenientPacingForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLenientPacingForecast(item: LenientPacingForecast): string {
  return classifyLegacyFrequencyThreshold(item.weightedVolume());
}
