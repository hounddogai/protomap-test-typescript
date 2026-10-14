import { LevelEstimate } from "../../level/batched-level-cycle/level-estimate.js";
import { strictLevelAssignmentWeight } from "../../level/batched-level-cycle/strict-level-assignment-policy.js";
import { TieredRewardSlot, newTieredRewardSlot } from "./tiered-reward-slot.js";

export function summarizeLevelEstimatesForSlot(items: LevelEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredRewardSlotsFromEstimate(items: LevelEstimate[]): TieredRewardSlot[] {
  const out: TieredRewardSlot[] = [];
  for (const item of items) {
    const derived = newTieredRewardSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankTieredRewardSlot(item: TieredRewardSlot): number {
  return strictLevelAssignmentWeight(6, true);
}
