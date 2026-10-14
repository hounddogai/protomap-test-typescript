import { normalizePrimaryLeaderboardBundleCode } from "../leaderboard-agreement/primary-leaderboard-bundle-policy.js";
import { StrictLeaderboardAgreement } from "../leaderboard-agreement/strict-leaderboard-agreement.js";
import { LeaderboardSnapshot, newLeaderboardSnapshot } from "./leaderboard-snapshot.js";

export function summarizeStrictLeaderboardAgreementsForSnapshot(items: StrictLeaderboardAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLeaderboardSnapshotsFromAgreement(items: StrictLeaderboardAgreement[]): LeaderboardSnapshot[] {
  const out: LeaderboardSnapshot[] = [];
  for (const item of items) {
    const derived = newLeaderboardSnapshot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchLeaderboardSnapshot(item: LeaderboardSnapshot): string {
  return normalizePrimaryLeaderboardBundleCode(item.code);
}
