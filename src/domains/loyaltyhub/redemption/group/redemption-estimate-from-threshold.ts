import { classifyLevelReview } from "../../level/entry/level-review-policy.js";
import { PendingLevelThreshold } from "../../level/entry/pending-level-threshold.js";
import { RedemptionEstimate, newRedemptionEstimate } from "./redemption-estimate.js";

export function summarizePendingLevelThresholdsForEstimate(items: PendingLevelThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRedemptionEstimatesFromThreshold(items: PendingLevelThreshold[]): RedemptionEstimate[] {
  const out: RedemptionEstimate[] = [];
  for (const item of items) {
    const derived = newRedemptionEstimate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRedemptionEstimate(item: RedemptionEstimate): string {
  return classifyLevelReview(item.effectiveVolume());
}
