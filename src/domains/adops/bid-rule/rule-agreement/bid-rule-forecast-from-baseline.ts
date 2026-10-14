import { frequencyAdjustmentWeight } from "../../frequency/baseline/frequency-adjustment-policy.js";
import { LenientFrequencyBaseline } from "../../frequency/baseline/lenient-frequency-baseline.js";
import { BidRuleForecast, newBidRuleForecast } from "./bid-rule-forecast.js";

export function summarizeLenientFrequencyBaselinesForForecast(items: LenientFrequencyBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBidRuleForecastsFromBaseline(items: LenientFrequencyBaseline[]): BidRuleForecast[] {
  const out: BidRuleForecast[] = [];
  for (const item of items) {
    const derived = newBidRuleForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBidRuleForecast(item: BidRuleForecast): number {
  return frequencyAdjustmentWeight(2, true);
}
