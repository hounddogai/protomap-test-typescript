import { normalizeAdaptiveCreativeCycleCode } from "../../creative/cycle/adaptive-creative-cycle-policy.js";
import { CappedCreativeBundle } from "../../creative/cycle/capped-creative-bundle.js";
import { BidRuleForecast, newBidRuleForecast } from "./bid-rule-forecast.js";

export function summarizeCappedCreativeBundlesForForecast(items: CappedCreativeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveBidRuleForecastsFromBundle(items: CappedCreativeBundle[]): BidRuleForecast[] {
  const out: BidRuleForecast[] = [];
  for (const item of items) {
    const derived = newBidRuleForecast(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileBidRuleForecast(item: BidRuleForecast): string {
  return normalizeAdaptiveCreativeCycleCode(item.code);
}
