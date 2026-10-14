import { normalizePayoutAllocationCode } from "../../payout/budget/payout-allocation-policy.js";
import { PayoutReservation } from "../../payout/budget/payout-reservation.js";
import { LeaderboardMilestone, newLeaderboardMilestone } from "./leaderboard-milestone.js";

export function summarizePayoutReservationsForMilestone(items: PayoutReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveLeaderboardMilestonesFromReservation(items: PayoutReservation[]): LeaderboardMilestone[] {
  const out: LeaderboardMilestone[] = [];
  for (const item of items) {
    const derived = newLeaderboardMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLeaderboardMilestone(item: LeaderboardMilestone): string {
  return normalizePayoutAllocationCode(item.code);
}
