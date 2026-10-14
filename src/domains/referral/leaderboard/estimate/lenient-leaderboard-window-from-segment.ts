import { normalizeGlobalTierDigestCode } from "../../tier/rule/global-tier-digest-policy.js";
import { RollingTierSegment } from "../../tier/rule/rolling-tier-segment.js";
import { LenientLeaderboardWindow, newLenientLeaderboardWindow } from "./lenient-leaderboard-window.js";

export function summarizeRollingTierSegmentsForWindow(items: RollingTierSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLenientLeaderboardWindowsFromSegment(items: RollingTierSegment[]): LenientLeaderboardWindow[] {
  const out: LenientLeaderboardWindow[] = [];
  for (const item of items) {
    const derived = newLenientLeaderboardWindow(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitLenientLeaderboardWindow(item: LenientLeaderboardWindow): string {
  return normalizeGlobalTierDigestCode(item.code);
}
