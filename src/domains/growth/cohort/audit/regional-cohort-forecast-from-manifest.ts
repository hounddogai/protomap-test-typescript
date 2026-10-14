import { PrimaryFunnelManifest } from "../../funnel/funnel-manifest/primary-funnel-manifest.js";
import { weightedFunnelAgreementWeight } from "../../funnel/funnel-manifest/weighted-funnel-agreement-policy.js";
import { RegionalCohortForecast, newRegionalCohortForecast } from "./regional-cohort-forecast.js";

export function summarizePrimaryFunnelManifestsForForecast(items: PrimaryFunnelManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRegionalCohortForecastsFromManifest(items: PrimaryFunnelManifest[]): RegionalCohortForecast[] {
  const out: RegionalCohortForecast[] = [];
  for (const item of items) {
    const derived = newRegionalCohortForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalCohortForecast(item: RegionalCohortForecast): number {
  return weightedFunnelAgreementWeight(7, true);
}
