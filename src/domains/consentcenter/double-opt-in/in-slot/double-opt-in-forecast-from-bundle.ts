import { CappedDoubleOptInBundle } from "../batched-in-bundle/capped-double-opt-in-bundle.js";
import { classifyLegacyDoubleOptInLedger } from "../batched-in-bundle/legacy-double-opt-in-ledger-policy.js";
import { DoubleOptInForecast, newDoubleOptInForecast } from "./double-opt-in-forecast.js";

export function summarizeCappedDoubleOptInBundlesForForecast(items: CappedDoubleOptInBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveDoubleOptInForecastsFromBundle(items: CappedDoubleOptInBundle[]): DoubleOptInForecast[] {
  const out: DoubleOptInForecast[] = [];
  for (const item of items) {
    const derived = newDoubleOptInForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignDoubleOptInForecast(item: DoubleOptInForecast): string {
  return classifyLegacyDoubleOptInLedger(item.weightedVolume());
}
