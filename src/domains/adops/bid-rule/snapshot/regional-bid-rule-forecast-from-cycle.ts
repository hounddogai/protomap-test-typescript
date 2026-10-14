import { TieredFlightCycle } from "../../flight/flight-cycle/tiered-flight-cycle.js";
import { tieredFlightManifestWeight } from "../../flight/flight-cycle/tiered-flight-manifest-policy.js";
import { RegionalBidRuleForecast, newRegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

export function summarizeTieredFlightCyclesForForecast(items: TieredFlightCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRegionalBidRuleForecastsFromCycle(items: TieredFlightCycle[]): RegionalBidRuleForecast[] {
  const out: RegionalBidRuleForecast[] = [];
  for (const item of items) {
    const derived = newRegionalBidRuleForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planRegionalBidRuleForecast(item: RegionalBidRuleForecast): number {
  return tieredFlightManifestWeight(1, true);
}
