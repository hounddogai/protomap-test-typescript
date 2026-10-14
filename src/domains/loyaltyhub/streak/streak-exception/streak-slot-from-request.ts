import { PrimaryRewardRequest } from "../../reward/target/primary-reward-request.js";
import { normalizeTieredRewardCheckpointCode } from "../../reward/target/tiered-reward-checkpoint-policy.js";
import { StreakSlot, newStreakSlot } from "./streak-slot.js";

export function summarizePrimaryRewardRequestsForSlot(items: PrimaryRewardRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveStreakSlotsFromRequest(items: PrimaryRewardRequest[]): StreakSlot[] {
  const out: StreakSlot[] = [];
  for (const item of items) {
    const derived = newStreakSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectStreakSlotExtra(item: StreakSlot): string {
  return normalizeTieredRewardCheckpointCode(item.code);
}
