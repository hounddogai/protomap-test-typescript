import { adaptiveTouchpointForecastBucket } from "../../touchpoint/adjustment/adaptive-touchpoint-forecast-policy.js";
import { AdaptiveTouchpointForecast } from "../../touchpoint/adjustment/adaptive-touchpoint-forecast.js";
import { CreditNotice, newCreditNotice } from "./credit-notice.js";

export function summarizeAdaptiveTouchpointForecastsForNotice(items: AdaptiveTouchpointForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCreditNoticesFromForecast(items: AdaptiveTouchpointForecast[]): CreditNotice[] {
  const out: CreditNotice[] = [];
  for (const item of items) {
    const derived = newCreditNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCreditNotice(item: CreditNotice): string {
  return adaptiveTouchpointForecastBucket(item.weightedExposure());
}
