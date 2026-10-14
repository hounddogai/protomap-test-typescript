import { normalizeAdaptiveComplaintMetricCode } from "../complaint-ledger/adaptive-complaint-metric-policy.js";
import { AdaptiveComplaintMetric } from "../complaint-ledger/adaptive-complaint-metric.js";
import { ComplaintForecast, newComplaintForecast } from "./complaint-forecast.js";

export function summarizeAdaptiveComplaintMetricsForForecast(items: AdaptiveComplaintMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveComplaintForecastsFromMetric(items: AdaptiveComplaintMetric[]): ComplaintForecast[] {
  const out: ComplaintForecast[] = [];
  for (const item of items) {
    const derived = newComplaintForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceComplaintForecast(item: ComplaintForecast): string {
  return normalizeAdaptiveComplaintMetricCode(item.code);
}
