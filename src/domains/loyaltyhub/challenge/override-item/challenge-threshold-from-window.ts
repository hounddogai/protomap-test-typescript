import { rewardScheduleBucket } from "../../reward/schedule/reward-schedule-policy.js";
import { RewardWindow } from "../../reward/schedule/reward-window.js";
import { ChallengeThreshold, newChallengeThreshold } from "./challenge-threshold.js";

export function summarizeRewardWindowsForThreshold(items: RewardWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveChallengeThresholdsFromWindow(items: RewardWindow[]): ChallengeThreshold[] {
  const out: ChallengeThreshold[] = [];
  for (const item of items) {
    const derived = newChallengeThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreChallengeThreshold(item: ChallengeThreshold): string {
  return rewardScheduleBucket(item.measuredValue());
}
