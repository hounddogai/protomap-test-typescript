import { classifyRewardNotice } from "../request/reward-notice-policy.js";
import { RewardNotice } from "../request/reward-notice.js";
import { RewardSegment, newRewardSegment } from "./reward-segment.js";

export function summarizeRewardNoticesForSegment(items: RewardNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRewardSegmentsFromNotice(items: RewardNotice[]): RewardSegment[] {
  const out: RewardSegment[] = [];
  for (const item of items) {
    const derived = newRewardSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRewardSegment(item: RewardSegment): string {
  return classifyRewardNotice(item.effectiveLoad());
}
