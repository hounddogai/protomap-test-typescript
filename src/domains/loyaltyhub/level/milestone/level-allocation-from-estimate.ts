import { tieredRewardEstimateBucket } from "../../reward/estimate/tiered-reward-estimate-policy.js";
import { TieredRewardEstimate } from "../../reward/estimate/tiered-reward-estimate.js";
import { LevelAllocation, newLevelAllocation } from "./level-allocation.js";

export function summarizeTieredRewardEstimatesForAllocation(items: TieredRewardEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLevelAllocationsFromEstimate(items: TieredRewardEstimate[]): LevelAllocation[] {
  const out: LevelAllocation[] = [];
  for (const item of items) {
    const derived = newLevelAllocation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateLevelAllocation(item: LevelAllocation): string {
  return tieredRewardEstimateBucket(item.adjustedLoad());
}
