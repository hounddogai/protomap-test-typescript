import { AdaptiveReputationPlan } from "../../reputation/mapping/adaptive-reputation-plan.js";
import { reputationSegmentWeight } from "../../reputation/mapping/reputation-segment-policy.js";
import { LenientWarmupMilestone, newLenientWarmupMilestone } from "./lenient-warmup-milestone.js";

export function summarizeAdaptiveReputationPlansForMilestone(items: AdaptiveReputationPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLenientWarmupMilestonesFromPlan(items: AdaptiveReputationPlan[]): LenientWarmupMilestone[] {
  const out: LenientWarmupMilestone[] = [];
  for (const item of items) {
    const derived = newLenientWarmupMilestone(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignLenientWarmupMilestone(item: LenientWarmupMilestone): number {
  return reputationSegmentWeight(6, true);
}
