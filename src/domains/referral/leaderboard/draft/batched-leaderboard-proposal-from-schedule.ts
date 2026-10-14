import { LeaderboardSchedule } from "../leaderboard-template/leaderboard-schedule.js";
import { strictLeaderboardAllocationWeight } from "../leaderboard-template/strict-leaderboard-allocation-policy.js";
import { BatchedLeaderboardProposal, newBatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

export function summarizeLeaderboardSchedulesForProposal(items: LeaderboardSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBatchedLeaderboardProposalsFromSchedule(items: LeaderboardSchedule[]): BatchedLeaderboardProposal[] {
  const out: BatchedLeaderboardProposal[] = [];
  for (const item of items) {
    const derived = newBatchedLeaderboardProposal(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeBatchedLeaderboardProposal(item: BatchedLeaderboardProposal): number {
  return strictLeaderboardAllocationWeight(8, true);
}
