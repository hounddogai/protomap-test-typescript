import { normalizeCreditForecastCode } from "../forecast/credit-forecast-policy.js";
import { CreditForecast } from "../forecast/credit-forecast.js";
import { PendingCreditEstimate, newPendingCreditEstimate } from "./pending-credit-estimate.js";

export function summarizeCreditForecastsForEstimate(items: CreditForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePendingCreditEstimatesFromForecast(items: CreditForecast[]): PendingCreditEstimate[] {
  const out: PendingCreditEstimate[] = [];
  for (const item of items) {
    const derived = newPendingCreditEstimate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePendingCreditEstimate(item: PendingCreditEstimate): string {
  return normalizeCreditForecastCode(item.code);
}
