import { AdaptiveLevelForecast } from "../../level/profile/adaptive-level-forecast.js";
import { classifyLevelSnapshot } from "../../level/profile/level-snapshot-policy.js";
import { ChallengeDigest, newChallengeDigest } from "./challenge-digest.js";

export function summarizeAdaptiveLevelForecastsForDigest(items: AdaptiveLevelForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveChallengeDigestsFromForecast(items: AdaptiveLevelForecast[]): ChallengeDigest[] {
  const out: ChallengeDigest[] = [];
  for (const item of items) {
    const derived = newChallengeDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyChallengeDigestExtra(item: ChallengeDigest): string {
  return classifyLevelSnapshot(item.effectiveTotal());
}
