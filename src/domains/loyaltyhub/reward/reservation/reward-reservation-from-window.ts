import { normalizeLevelMilestoneCode } from "../../level/window/level-milestone-policy.js";
import { LevelWindow } from "../../level/window/level-window.js";
import { RewardReservation, newRewardReservation } from "./reward-reservation.js";

export function summarizeLevelWindowsForReservation(items: LevelWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRewardReservationsFromWindow(items: LevelWindow[]): RewardReservation[] {
  const out: RewardReservation[] = [];
  for (const item of items) {
    const derived = newRewardReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRewardReservation(item: RewardReservation): string {
  return normalizeLevelMilestoneCode(item.code);
}
