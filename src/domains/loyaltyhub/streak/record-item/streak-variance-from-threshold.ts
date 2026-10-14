import { challengeSlotBucket } from "../../challenge/override-item/challenge-slot-policy.js";
import { ChallengeThreshold } from "../../challenge/override-item/challenge-threshold.js";
import { StreakVariance, newStreakVariance } from "./streak-variance.js";

export function summarizeChallengeThresholdsForVariance(items: ChallengeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStreakVariancesFromThreshold(items: ChallengeThreshold[]): StreakVariance[] {
  const out: StreakVariance[] = [];
  for (const item of items) {
    const derived = newStreakVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeStreakVariance(item: StreakVariance): string {
  return challengeSlotBucket(item.weightedValue());
}
