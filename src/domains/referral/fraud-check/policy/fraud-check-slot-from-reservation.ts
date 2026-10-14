import { leaderboardProposalWeight } from "../../leaderboard/strict-leaderboard-plan/leaderboard-proposal-policy.js";
import { LeaderboardReservation } from "../../leaderboard/strict-leaderboard-plan/leaderboard-reservation.js";
import { FraudCheckSlot, newFraudCheckSlot } from "./fraud-check-slot.js";

export function summarizeLeaderboardReservationsForSlot(items: LeaderboardReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFraudCheckSlotsFromReservation(items: LeaderboardReservation[]): FraudCheckSlot[] {
  const out: FraudCheckSlot[] = [];
  for (const item of items) {
    const derived = newFraudCheckSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyFraudCheckSlotExtra(item: FraudCheckSlot): number {
  return leaderboardProposalWeight(6, true);
}
