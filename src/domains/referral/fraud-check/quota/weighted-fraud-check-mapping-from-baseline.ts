import { seasonalTierBaselineWeight } from "../../tier/metric/seasonal-tier-baseline-policy.js";
import { SeasonalTierBaseline } from "../../tier/metric/seasonal-tier-baseline.js";
import { WeightedFraudCheckMapping, newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

export function summarizeSeasonalTierBaselinesForMapping(items: SeasonalTierBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedFraudCheckMappingsFromBaseline(items: SeasonalTierBaseline[]): WeightedFraudCheckMapping[] {
  const out: WeightedFraudCheckMapping[] = [];
  for (const item of items) {
    const derived = newWeightedFraudCheckMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedFraudCheckMapping(item: WeightedFraudCheckMapping): number {
  return seasonalTierBaselineWeight(5, true);
}
