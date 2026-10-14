import { nudgeForecastBucket } from "../../nudge/draft/nudge-forecast-policy.js";
import { NudgeForecast } from "../../nudge/draft/nudge-forecast.js";
import { CappedActivationBundle, newCappedActivationBundle } from "./capped-activation-bundle.js";

export function summarizeNudgeForecastsForBundle(items: NudgeForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedActivationBundlesFromForecast(items: NudgeForecast[]): CappedActivationBundle[] {
  const out: CappedActivationBundle[] = [];
  for (const item of items) {
    const derived = newCappedActivationBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCappedActivationBundle(item: CappedActivationBundle): string {
  return nudgeForecastBucket(item.measuredValue());
}
