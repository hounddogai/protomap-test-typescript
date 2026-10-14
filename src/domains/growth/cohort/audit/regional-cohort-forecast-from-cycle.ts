import { primaryPaywallCycleBucket } from "../../paywall/pending-paywall-window/primary-paywall-cycle-policy.js";
import { PrimaryPaywallCycle } from "../../paywall/pending-paywall-window/primary-paywall-cycle.js";
import { RegionalCohortForecast, newRegionalCohortForecast } from "./regional-cohort-forecast.js";

export function summarizePrimaryPaywallCyclesForForecast(items: PrimaryPaywallCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRegionalCohortForecastsFromCycle(items: PrimaryPaywallCycle[]): RegionalCohortForecast[] {
  const out: RegionalCohortForecast[] = [];
  for (const item of items) {
    const derived = newRegionalCohortForecast(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRegionalCohortForecast(item: RegionalCohortForecast): string {
  return primaryPaywallCycleBucket(item.weightedTotal());
}
