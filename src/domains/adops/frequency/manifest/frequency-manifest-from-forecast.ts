import { bidRuleForecastWeight } from "../../bid-rule/rule-agreement/bid-rule-forecast-policy.js";
import { BidRuleForecast } from "../../bid-rule/rule-agreement/bid-rule-forecast.js";
import { FrequencyManifest, newFrequencyManifest } from "./frequency-manifest.js";

export function summarizeBidRuleForecastsForManifest(items: BidRuleForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveFrequencyManifestsFromForecast(items: BidRuleForecast[]): FrequencyManifest[] {
  const out: FrequencyManifest[] = [];
  for (const item of items) {
    const derived = newFrequencyManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFrequencyManifest(item: FrequencyManifest): number {
  return bidRuleForecastWeight(1, true);
}
