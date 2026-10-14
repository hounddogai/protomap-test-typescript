import { bidRuleSummaryWeight } from "../../bid-rule/quota/bid-rule-summary-policy.js";
import { CappedBidRuleQuota } from "../../bid-rule/quota/capped-bid-rule-quota.js";
import { PlacementForecast, newPlacementForecast } from "./placement-forecast.js";

export function summarizeCappedBidRuleQuotasForForecast(items: CappedBidRuleQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePlacementForecastsFromQuota(items: CappedBidRuleQuota[]): PlacementForecast[] {
  const out: PlacementForecast[] = [];
  for (const item of items) {
    const derived = newPlacementForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePlacementForecast(item: PlacementForecast): number {
  return bidRuleSummaryWeight(9, true);
}
