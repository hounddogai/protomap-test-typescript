import { bidRuleForecastWeight } from "../rule-agreement/bid-rule-forecast-policy.js";
import { BidRuleForecast } from "../rule-agreement/bid-rule-forecast.js";
import { LegacyBidRuleThreshold, newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

export function summarizeBidRuleForecastsForThreshold(items: BidRuleForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveLegacyBidRuleThresholdsFromForecast(items: BidRuleForecast[]): LegacyBidRuleThreshold[] {
  const out: LegacyBidRuleThreshold[] = [];
  for (const item of items) {
    const derived = newLegacyBidRuleThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyBidRuleThreshold(item: LegacyBidRuleThreshold): number {
  return bidRuleForecastWeight(6, true);
}
