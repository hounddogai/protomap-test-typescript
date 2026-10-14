import { TouchpointForecast } from "../metric/touchpoint-forecast.js";
import { normalizeTouchpointMetricCode } from "../metric/touchpoint-metric-policy.js";
import { PrimaryTouchpointManifest, newPrimaryTouchpointManifest } from "./primary-touchpoint-manifest.js";

export function summarizeTouchpointForecastsForManifest(items: TouchpointForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePrimaryTouchpointManifestsFromForecast(items: TouchpointForecast[]): PrimaryTouchpointManifest[] {
  const out: PrimaryTouchpointManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryTouchpointManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePrimaryTouchpointManifest(item: PrimaryTouchpointManifest): string {
  return normalizeTouchpointMetricCode(item.code);
}
