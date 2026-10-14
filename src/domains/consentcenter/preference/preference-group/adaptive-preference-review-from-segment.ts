import {
  normalizeSeasonalSubscriptionSegmentCode,
} from "../../subscription/agreement/seasonal-subscription-segment-policy.js";
import { SeasonalSubscriptionSegment } from "../../subscription/agreement/seasonal-subscription-segment.js";
import { AdaptivePreferenceReview, newAdaptivePreferenceReview } from "./adaptive-preference-review.js";

export function summarizeSeasonalSubscriptionSegmentsForReview(items: SeasonalSubscriptionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveAdaptivePreferenceReviewsFromSegment(items: SeasonalSubscriptionSegment[]): AdaptivePreferenceReview[] {
  const out: AdaptivePreferenceReview[] = [];
  for (const item of items) {
    const derived = newAdaptivePreferenceReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyAdaptivePreferenceReview(item: AdaptivePreferenceReview): string {
  return normalizeSeasonalSubscriptionSegmentCode(item.code);
}
