import { classifyLeaderboardQuota } from "../quota/leaderboard-quota-policy.js";
import { LeaderboardSegment } from "../quota/leaderboard-segment.js";
import { LeaderboardLedger, newLeaderboardLedger } from "./leaderboard-ledger.js";

export function summarizeLeaderboardSegmentsForLedger(items: LeaderboardSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLeaderboardLedgersFromSegment(items: LeaderboardSegment[]): LeaderboardLedger[] {
  const out: LeaderboardLedger[] = [];
  for (const item of items) {
    const derived = newLeaderboardLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLeaderboardLedger(item: LeaderboardLedger): string {
  return classifyLeaderboardQuota(item.projectedTotal());
}
