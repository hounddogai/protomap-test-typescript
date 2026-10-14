import { rewardSegmentWeight } from "../draft/reward-segment-policy.js";
import { RewardSegment } from "../draft/reward-segment.js";
import { RewardOverride, newRewardOverride } from "./reward-override.js";

export function summarizeRewardSegmentsForOverride(items: RewardSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveRewardOverridesFromSegment(items: RewardSegment[]): RewardOverride[] {
  const out: RewardOverride[] = [];
  for (const item of items) {
    const derived = newRewardOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRewardOverride(item: RewardOverride): number {
  return rewardSegmentWeight(2, true);
}
