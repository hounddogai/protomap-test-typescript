import { classifyPreferenceVariance } from "../policy/preference-variance-policy.js";
import { PreferenceVariance } from "../policy/preference-variance.js";
import { PreferenceMapping, newPreferenceMapping } from "./preference-mapping.js";

export function summarizePreferenceVariancesForMapping(items: PreferenceVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePreferenceMappingsFromVariance(items: PreferenceVariance[]): PreferenceMapping[] {
  const out: PreferenceMapping[] = [];
  for (const item of items) {
    const derived = newPreferenceMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePreferenceMapping(item: PreferenceMapping): string {
  return classifyPreferenceVariance(item.adjustedLoad());
}
