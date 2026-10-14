import { tieredTierBaselineBucket } from "../../tier/tier-variance/tiered-tier-baseline-policy.js";
import { TieredTierBaseline } from "../../tier/tier-variance/tiered-tier-baseline.js";
import { LegacyLeaderboardReview, newLegacyLeaderboardReview } from "./legacy-leaderboard-review.js";

export function summarizeTieredTierBaselinesForReview(items: TieredTierBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLegacyLeaderboardReviewsFromBaseline(items: TieredTierBaseline[]): LegacyLeaderboardReview[] {
  const out: LegacyLeaderboardReview[] = [];
  for (const item of items) {
    const derived = newLegacyLeaderboardReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreLegacyLeaderboardReview(item: LegacyLeaderboardReview): string {
  return tieredTierBaselineBucket(item.netVolume());
}
