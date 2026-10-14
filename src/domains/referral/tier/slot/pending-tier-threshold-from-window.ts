import {
  normalizeLenientLeaderboardWindowCode,
} from "../../leaderboard/estimate/lenient-leaderboard-window-policy.js";
import { LenientLeaderboardWindow } from "../../leaderboard/estimate/lenient-leaderboard-window.js";
import { PendingTierThreshold, newPendingTierThreshold } from "./pending-tier-threshold.js";

export function summarizeLenientLeaderboardWindowsForThreshold(items: LenientLeaderboardWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePendingTierThresholdsFromWindow(items: LenientLeaderboardWindow[]): PendingTierThreshold[] {
  const out: PendingTierThreshold[] = [];
  for (const item of items) {
    const derived = newPendingTierThreshold(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computePendingTierThreshold(item: PendingTierThreshold): string {
  return normalizeLenientLeaderboardWindowCode(item.code);
}
