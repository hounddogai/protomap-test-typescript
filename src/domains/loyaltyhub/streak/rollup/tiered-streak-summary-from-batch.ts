import { RewardBatch } from "../../reward/request/reward-batch.js";
import { classifyRewardNotice } from "../../reward/request/reward-notice-policy.js";
import { TieredStreakSummary, newTieredStreakSummary } from "./tiered-streak-summary.js";

export function summarizeRewardBatchesForSummary(items: RewardBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveTieredStreakSummariesFromBatch(items: RewardBatch[]): TieredStreakSummary[] {
  const out: TieredStreakSummary[] = [];
  for (const item of items) {
    const derived = newTieredStreakSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredStreakSummary(item: TieredStreakSummary): string {
  return classifyRewardNotice(item.projectedLoad());
}
