import { seasonalLeaderboardLedgerBucket } from "../../leaderboard/snapshot/seasonal-leaderboard-ledger-policy.js";
import { SeasonalLeaderboardLedger } from "../../leaderboard/snapshot/seasonal-leaderboard-ledger.js";
import { LenientPayoutLedger, newLenientPayoutLedger } from "./lenient-payout-ledger.js";

export function summarizeSeasonalLeaderboardLedgersForLedger(items: SeasonalLeaderboardLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveLenientPayoutLedgersFromLedger(items: SeasonalLeaderboardLedger[]): LenientPayoutLedger[] {
  const out: LenientPayoutLedger[] = [];
  for (const item of items) {
    const derived = newLenientPayoutLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLenientPayoutLedger(item: LenientPayoutLedger): string {
  return seasonalLeaderboardLedgerBucket(item.weightedLoad());
}
