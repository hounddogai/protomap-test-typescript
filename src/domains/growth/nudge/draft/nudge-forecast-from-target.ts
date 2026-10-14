import { funnelAssignmentBucket } from "../../funnel/rule/funnel-assignment-policy.js";
import { FunnelTarget } from "../../funnel/rule/funnel-target.js";
import { NudgeForecast, newNudgeForecast } from "./nudge-forecast.js";

export function summarizeFunnelTargetsForForecast(items: FunnelTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveNudgeForecastsFromTarget(items: FunnelTarget[]): NudgeForecast[] {
  const out: NudgeForecast[] = [];
  for (const item of items) {
    const derived = newNudgeForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleNudgeForecast(item: NudgeForecast): string {
  return funnelAssignmentBucket(item.measuredValue());
}
