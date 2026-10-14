import {
  normalizeScheduledReputationPreferenceCode,
} from "../../reputation/draft/scheduled-reputation-preference-policy.js";
import { WeightedReputationTarget } from "../../reputation/draft/weighted-reputation-target.js";
import { DefaultWarmupReview, newDefaultWarmupReview } from "./default-warmup-review.js";

export function summarizeWeightedReputationTargetsForReview(items: WeightedReputationTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveDefaultWarmupReviewsFromTarget(items: WeightedReputationTarget[]): DefaultWarmupReview[] {
  const out: DefaultWarmupReview[] = [];
  for (const item of items) {
    const derived = newDefaultWarmupReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchDefaultWarmupReview(item: DefaultWarmupReview): string {
  return normalizeScheduledReputationPreferenceCode(item.code);
}
