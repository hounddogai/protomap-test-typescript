import { classifyPlacementForecast } from "../../placement/exception/placement-forecast-policy.js";
import { StrictPlacementForecast } from "../../placement/exception/strict-placement-forecast.js";
import { StrictBidRuleSlot, newStrictBidRuleSlot } from "./strict-bid-rule-slot.js";

export function summarizeStrictPlacementForecastsForSlot(items: StrictPlacementForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveStrictBidRuleSlotsFromForecast(items: StrictPlacementForecast[]): StrictBidRuleSlot[] {
  const out: StrictBidRuleSlot[] = [];
  for (const item of items) {
    const derived = newStrictBidRuleSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyStrictBidRuleSlot(item: StrictBidRuleSlot): string {
  return classifyPlacementForecast(item.weightedLoad());
}
