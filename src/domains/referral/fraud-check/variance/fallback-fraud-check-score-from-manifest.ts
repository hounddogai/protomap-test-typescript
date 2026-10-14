import { leaderboardManifestWeight } from "../../leaderboard/leaderboard-summary/leaderboard-manifest-policy.js";
import { LeaderboardManifest } from "../../leaderboard/leaderboard-summary/leaderboard-manifest.js";
import { FallbackFraudCheckScore, newFallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

export function summarizeLeaderboardManifestsForScore(items: LeaderboardManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFallbackFraudCheckScoresFromManifest(items: LeaderboardManifest[]): FallbackFraudCheckScore[] {
  const out: FallbackFraudCheckScore[] = [];
  for (const item of items) {
    const derived = newFallbackFraudCheckScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyFallbackFraudCheckScore(item: FallbackFraudCheckScore): number {
  return leaderboardManifestWeight(4, true);
}
