import { lenientChallengeScoreBucket } from "../adaptive-challenge-manifest/lenient-challenge-score-policy.js";
import { TieredChallengeTier } from "../adaptive-challenge-manifest/tiered-challenge-tier.js";
import { BatchedChallengeBaseline, newBatchedChallengeBaseline } from "./batched-challenge-baseline.js";

export function summarizeTieredChallengeTiersForBaseline(items: TieredChallengeTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBatchedChallengeBaselinesFromTier(items: TieredChallengeTier[]): BatchedChallengeBaseline[] {
  const out: BatchedChallengeBaseline[] = [];
  for (const item of items) {
    const derived = newBatchedChallengeBaseline(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedChallengeBaseline(item: BatchedChallengeBaseline): string {
  return lenientChallengeScoreBucket(item.measuredValue());
}
