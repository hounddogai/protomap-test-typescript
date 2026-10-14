import { classifyGlobalStreakBundle } from "../../streak/forecast/global-streak-bundle-policy.js";
import { StreakForecast } from "../../streak/forecast/streak-forecast.js";
import { BadgeLedger, newBadgeLedger } from "./badge-ledger.js";

export function summarizeStreakForecastsForLedger(items: StreakForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBadgeLedgersFromForecast(items: StreakForecast[]): BadgeLedger[] {
  const out: BadgeLedger[] = [];
  for (const item of items) {
    const derived = newBadgeLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBadgeLedger(item: BadgeLedger): string {
  return classifyGlobalStreakBundle(item.measuredValue());
}
