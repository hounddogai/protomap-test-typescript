import { classifyManualDoubleOptInDraft } from "../../double-opt-in/group/manual-double-opt-in-draft-policy.js";
import { PrimaryDoubleOptInThreshold } from "../../double-opt-in/group/primary-double-opt-in-threshold.js";
import { AdaptivePreferenceReview, newAdaptivePreferenceReview } from "./adaptive-preference-review.js";

export function summarizePrimaryDoubleOptInThresholdsForReview(items: PrimaryDoubleOptInThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveAdaptivePreferenceReviewsFromThreshold(items: PrimaryDoubleOptInThreshold[]): AdaptivePreferenceReview[] {
  const out: AdaptivePreferenceReview[] = [];
  for (const item of items) {
    const derived = newAdaptivePreferenceReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptivePreferenceReview(item: AdaptivePreferenceReview): string {
  return classifyManualDoubleOptInDraft(item.netValue());
}
