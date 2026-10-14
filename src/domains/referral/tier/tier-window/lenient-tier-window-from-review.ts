import { legacyLeaderboardReviewWeight } from "../../leaderboard/review/legacy-leaderboard-review-policy.js";
import { LegacyLeaderboardReview } from "../../leaderboard/review/legacy-leaderboard-review.js";
import { LenientTierWindow, newLenientTierWindow } from "./lenient-tier-window.js";

export function summarizeLegacyLeaderboardReviewsForWindow(items: LegacyLeaderboardReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveLenientTierWindowsFromReview(items: LegacyLeaderboardReview[]): LenientTierWindow[] {
  const out: LenientTierWindow[] = [];
  for (const item of items) {
    const derived = newLenientTierWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLenientTierWindow(item: LenientTierWindow): number {
  return legacyLeaderboardReviewWeight(1, true);
}
