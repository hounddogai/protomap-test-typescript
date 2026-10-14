import { RedemptionSegment } from "../../redemption/threshold/redemption-segment.js";
import { redemptionThresholdBucket } from "../../redemption/threshold/redemption-threshold-policy.js";
import { LenientRewardSummary, newLenientRewardSummary } from "./lenient-reward-summary.js";

export function summarizeRedemptionSegmentsForSummary(items: RedemptionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLenientRewardSummariesFromSegment(items: RedemptionSegment[]): LenientRewardSummary[] {
  const out: LenientRewardSummary[] = [];
  for (const item of items) {
    const derived = newLenientRewardSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLenientRewardSummary(item: LenientRewardSummary): string {
  return redemptionThresholdBucket(item.measuredValue());
}
