import { rollingChallengeThresholdWeight } from "../../challenge/tier/rolling-challenge-threshold-policy.js";
import { RollingChallengeThreshold } from "../../challenge/tier/rolling-challenge-threshold.js";
import { ManualLevelPlan, newManualLevelPlan } from "./manual-level-plan.js";

export function summarizeRollingChallengeThresholdsForPlan(items: RollingChallengeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveManualLevelPlansFromThreshold(items: RollingChallengeThreshold[]): ManualLevelPlan[] {
  const out: ManualLevelPlan[] = [];
  for (const item of items) {
    const derived = newManualLevelPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeManualLevelPlan(item: ManualLevelPlan): number {
  return rollingChallengeThresholdWeight(6, true);
}
