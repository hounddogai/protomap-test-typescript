import { BatchedTouchpointPreference } from "../../touchpoint/bundle/batched-touchpoint-preference.js";
import { touchpointBudgetWeight } from "../../touchpoint/bundle/touchpoint-budget-policy.js";
import { AdaptiveConversionPreference, newAdaptiveConversionPreference } from "./adaptive-conversion-preference.js";

export function summarizeBatchedTouchpointPreferencesForPreference(items: BatchedTouchpointPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveAdaptiveConversionPreferencesFromPreference(items: BatchedTouchpointPreference[]): AdaptiveConversionPreference[] {
  const out: AdaptiveConversionPreference[] = [];
  for (const item of items) {
    const derived = newAdaptiveConversionPreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveConversionPreference(item: AdaptiveConversionPreference): number {
  return touchpointBudgetWeight(8, true);
}
