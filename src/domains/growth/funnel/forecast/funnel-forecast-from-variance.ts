import { normalizeNudgeEstimateCode } from "../../nudge/window/nudge-estimate-policy.js";
import { NudgeVariance } from "../../nudge/window/nudge-variance.js";
import { FunnelForecast, newFunnelForecast } from "./funnel-forecast.js";

export function summarizeNudgeVariancesForForecast(items: NudgeVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFunnelForecastsFromVariance(items: NudgeVariance[]): FunnelForecast[] {
  const out: FunnelForecast[] = [];
  for (const item of items) {
    const derived = newFunnelForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignFunnelForecast(item: FunnelForecast): string {
  return normalizeNudgeEstimateCode(item.code);
}
