import { SeasonalTouchpointPlan } from "../../touchpoint/metric/seasonal-touchpoint-plan.js";
import { normalizeTouchpointForecastCode } from "../../touchpoint/metric/touchpoint-forecast-policy.js";
import { TieredPathMapping, newTieredPathMapping } from "./tiered-path-mapping.js";

export function summarizeSeasonalTouchpointPlansForMapping(items: SeasonalTouchpointPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredPathMappingsFromPlan(items: SeasonalTouchpointPlan[]): TieredPathMapping[] {
  const out: TieredPathMapping[] = [];
  for (const item of items) {
    const derived = newTieredPathMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleTieredPathMapping(item: TieredPathMapping): string {
  return normalizeTouchpointForecastCode(item.code);
}
