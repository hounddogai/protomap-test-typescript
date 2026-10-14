import { PendingLevelMilestone } from "../../level/milestone/pending-level-milestone.js";
import { rollingLevelAllocationWeight } from "../../level/milestone/rolling-level-allocation-policy.js";
import { LenientRewardProfile, newLenientRewardProfile } from "./lenient-reward-profile.js";

export function summarizePendingLevelMilestonesForProfile(items: PendingLevelMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveLenientRewardProfilesFromMilestone(items: PendingLevelMilestone[]): LenientRewardProfile[] {
  const out: LenientRewardProfile[] = [];
  for (const item of items) {
    const derived = newLenientRewardProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeLenientRewardProfile(item: LenientRewardProfile): number {
  return rollingLevelAllocationWeight(2, true);
}
