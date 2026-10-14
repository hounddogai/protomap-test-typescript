import { BounceReview } from "../../bounce/bounce-reservation/bounce-review.js";
import { normalizeTieredBounceManifestCode } from "../../bounce/bounce-reservation/tiered-bounce-manifest-policy.js";
import { SeasonalWarmupWindow, newSeasonalWarmupWindow } from "./seasonal-warmup-window.js";

export function summarizeBounceReviewsForWindow(items: BounceReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveSeasonalWarmupWindowsFromReview(items: BounceReview[]): SeasonalWarmupWindow[] {
  const out: SeasonalWarmupWindow[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalWarmupWindow(item: SeasonalWarmupWindow): string {
  return normalizeTieredBounceManifestCode(item.code);
}
