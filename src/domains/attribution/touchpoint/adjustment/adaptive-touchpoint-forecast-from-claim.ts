import { RollingConversionClaim } from "../../conversion/conversion-group/rolling-conversion-claim.js";
import { seasonalConversionGroupWeight } from "../../conversion/conversion-group/seasonal-conversion-group-policy.js";
import { AdaptiveTouchpointForecast, newAdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

export function summarizeRollingConversionClaimsForForecast(items: RollingConversionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveAdaptiveTouchpointForecastsFromClaim(items: RollingConversionClaim[]): AdaptiveTouchpointForecast[] {
  const out: AdaptiveTouchpointForecast[] = [];
  for (const item of items) {
    const derived = newAdaptiveTouchpointForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyAdaptiveTouchpointForecast(item: AdaptiveTouchpointForecast): number {
  return seasonalConversionGroupWeight(4, true);
}
