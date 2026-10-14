import { normalizeRewardBatchCode } from "../../reward/request/reward-batch-policy.js";
import { RewardBatch } from "../../reward/request/reward-batch.js";
import { BadgeAdjustment, newBadgeAdjustment } from "./badge-adjustment.js";

export function summarizeRewardBatchesForAdjustment(items: RewardBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveBadgeAdjustmentsFromBatch(items: RewardBatch[]): BadgeAdjustment[] {
  const out: BadgeAdjustment[] = [];
  for (const item of items) {
    const derived = newBadgeAdjustment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyBadgeAdjustment(item: BadgeAdjustment): string {
  return normalizeRewardBatchCode(item.code);
}
