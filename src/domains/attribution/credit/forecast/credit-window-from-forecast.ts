import { classifySeasonalWindowForecast } from "../../window/window-entry/seasonal-window-forecast-policy.js";
import { SeasonalWindowForecast } from "../../window/window-entry/seasonal-window-forecast.js";
import { CreditWindow, newCreditWindow } from "./credit-window.js";

export function summarizeSeasonalWindowForecastsForWindow(items: SeasonalWindowForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveCreditWindowsFromForecast(items: SeasonalWindowForecast[]): CreditWindow[] {
  const out: CreditWindow[] = [];
  for (const item of items) {
    const derived = newCreditWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCreditWindow(item: CreditWindow): string {
  return classifySeasonalWindowForecast(item.weightedTotal());
}
