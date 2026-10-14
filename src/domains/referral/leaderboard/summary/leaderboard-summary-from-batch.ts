import { payoutBatchWeight } from "../../payout/allocation/payout-batch-policy.js";
import { PayoutBatch } from "../../payout/allocation/payout-batch.js";
import { LeaderboardSummary, newLeaderboardSummary } from "./leaderboard-summary.js";

export function summarizePayoutBatchesForSummary(items: PayoutBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLeaderboardSummariesFromBatch(items: PayoutBatch[]): LeaderboardSummary[] {
  const out: LeaderboardSummary[] = [];
  for (const item of items) {
    const derived = newLeaderboardSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeLeaderboardSummary(item: LeaderboardSummary): number {
  return payoutBatchWeight(6, true);
}
