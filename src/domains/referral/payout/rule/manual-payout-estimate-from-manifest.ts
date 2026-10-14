import { leaderboardManifestBucket } from "../../leaderboard/leaderboard-summary/leaderboard-manifest-policy.js";
import { LeaderboardManifest } from "../../leaderboard/leaderboard-summary/leaderboard-manifest.js";
import { ManualPayoutEstimate, newManualPayoutEstimate } from "./manual-payout-estimate.js";

export function summarizeLeaderboardManifestsForEstimate(items: LeaderboardManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualPayoutEstimatesFromManifest(items: LeaderboardManifest[]): ManualPayoutEstimate[] {
  const out: ManualPayoutEstimate[] = [];
  for (const item of items) {
    const derived = newManualPayoutEstimate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveManualPayoutEstimate(item: ManualPayoutEstimate): string {
  return leaderboardManifestBucket(item.effectiveVolume());
}
