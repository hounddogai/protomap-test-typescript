import { normalizeBadgeAllocationCode } from "../../badge/profile/badge-allocation-policy.js";
import { BadgeAllocation } from "../../badge/profile/badge-allocation.js";
import { RewardSlot, newRewardSlot } from "./reward-slot.js";

export function summarizeBadgeAllocationsForSlot(items: BadgeAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardSlotsFromAllocation(items: BadgeAllocation[]): RewardSlot[] {
  const out: RewardSlot[] = [];
  for (const item of items) {
    const derived = newRewardSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreRewardSlot(item: RewardSlot): string {
  return normalizeBadgeAllocationCode(item.code);
}
