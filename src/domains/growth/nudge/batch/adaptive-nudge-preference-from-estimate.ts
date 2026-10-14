import { AdaptiveNudgeEstimate } from "../profile/adaptive-nudge-estimate.js";
import { classifyNudgeReview } from "../profile/nudge-review-policy.js";
import { AdaptiveNudgePreference, newAdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

export function summarizeAdaptiveNudgeEstimatesForPreference(items: AdaptiveNudgeEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveAdaptiveNudgePreferencesFromEstimate(items: AdaptiveNudgeEstimate[]): AdaptiveNudgePreference[] {
  const out: AdaptiveNudgePreference[] = [];
  for (const item of items) {
    const derived = newAdaptiveNudgePreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignAdaptiveNudgePreference(item: AdaptiveNudgePreference): string {
  return classifyNudgeReview(item.weightedVolume());
}
