import { adaptiveBounceGroupWeight } from "../../bounce/metric/adaptive-bounce-group-policy.js";
import { WeightedBouncePreference } from "../../bounce/metric/weighted-bounce-preference.js";
import { RegionalComplaintMapping, newRegionalComplaintMapping } from "./regional-complaint-mapping.js";

export function summarizeWeightedBouncePreferencesForMapping(items: WeightedBouncePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRegionalComplaintMappingsFromPreference(items: WeightedBouncePreference[]): RegionalComplaintMapping[] {
  const out: RegionalComplaintMapping[] = [];
  for (const item of items) {
    const derived = newRegionalComplaintMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRegionalComplaintMapping(item: RegionalComplaintMapping): number {
  return adaptiveBounceGroupWeight(4, true);
}
