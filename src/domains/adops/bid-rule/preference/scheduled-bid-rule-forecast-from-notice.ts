import { batchedPlacementBudgetBucket } from "../../placement/checkpoint/batched-placement-budget-policy.js";
import { PlacementNotice } from "../../placement/checkpoint/placement-notice.js";
import { ScheduledBidRuleForecast, newScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

export function summarizePlacementNoticesForForecast(items: PlacementNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveScheduledBidRuleForecastsFromNotice(items: PlacementNotice[]): ScheduledBidRuleForecast[] {
  const out: ScheduledBidRuleForecast[] = [];
  for (const item of items) {
    const derived = newScheduledBidRuleForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankScheduledBidRuleForecast(item: ScheduledBidRuleForecast): string {
  return batchedPlacementBudgetBucket(item.adjustedVolume());
}
