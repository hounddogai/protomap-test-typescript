import { adaptivePreferenceTargetBucket } from "../snapshot/adaptive-preference-target-policy.js";
import { AdaptivePreferenceTarget } from "../snapshot/adaptive-preference-target.js";
import { PreferenceSummary, newPreferenceSummary } from "./preference-summary.js";

export function summarizeAdaptivePreferenceTargetsForSummary(items: AdaptivePreferenceTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePreferenceSummariesFromTarget(items: AdaptivePreferenceTarget[]): PreferenceSummary[] {
  const out: PreferenceSummary[] = [];
  for (const item of items) {
    const derived = newPreferenceSummary(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPreferenceSummary(item: PreferenceSummary): string {
  return adaptivePreferenceTargetBucket(item.measuredValue());
}
