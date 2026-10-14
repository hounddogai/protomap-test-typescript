import { classifyFlightBaseline } from "../../flight/adjustment/flight-baseline-policy.js";
import { FlightBaseline } from "../../flight/adjustment/flight-baseline.js";
import { WeightedBidRuleOverride, newWeightedBidRuleOverride } from "./weighted-bid-rule-override.js";

export function summarizeFlightBaselinesForOverride(items: FlightBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWeightedBidRuleOverridesFromBaseline(items: FlightBaseline[]): WeightedBidRuleOverride[] {
  const out: WeightedBidRuleOverride[] = [];
  for (const item of items) {
    const derived = newWeightedBidRuleOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyWeightedBidRuleOverride(item: WeightedBidRuleOverride): string {
  return classifyFlightBaseline(item.measuredValue());
}
