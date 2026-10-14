import { normalizeBatchedFrequencyMetricCode } from "../frequency-metric/batched-frequency-metric-policy.js";
import { RegionalFrequencyForecast } from "../frequency-metric/regional-frequency-forecast.js";
import { PendingFrequencyRequest, newPendingFrequencyRequest } from "./pending-frequency-request.js";

export function summarizeRegionalFrequencyForecastsForRequest(items: RegionalFrequencyForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePendingFrequencyRequestsFromForecast(items: RegionalFrequencyForecast[]): PendingFrequencyRequest[] {
  const out: PendingFrequencyRequest[] = [];
  for (const item of items) {
    const derived = newPendingFrequencyRequest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignPendingFrequencyRequest(item: PendingFrequencyRequest): string {
  return normalizeBatchedFrequencyMetricCode(item.code);
}
