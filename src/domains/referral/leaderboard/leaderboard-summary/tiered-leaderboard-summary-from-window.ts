import { normalizeLenientLeaderboardWindowCode } from "../estimate/lenient-leaderboard-window-policy.js";
import { LenientLeaderboardWindow } from "../estimate/lenient-leaderboard-window.js";
import { TieredLeaderboardSummary, newTieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

export function summarizeLenientLeaderboardWindowsForSummary(items: LenientLeaderboardWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTieredLeaderboardSummariesFromWindow(items: LenientLeaderboardWindow[]): TieredLeaderboardSummary[] {
  const out: TieredLeaderboardSummary[] = [];
  for (const item of items) {
    const derived = newTieredLeaderboardSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignTieredLeaderboardSummary(item: TieredLeaderboardSummary): string {
  return normalizeLenientLeaderboardWindowCode(item.code);
}
