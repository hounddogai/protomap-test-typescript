import { classifyChallengeAdjustment } from "../../challenge/adjustment/challenge-adjustment-policy.js";
import { ChallengeException } from "../../challenge/adjustment/challenge-exception.js";
import { StrictRewardThreshold, newStrictRewardThreshold } from "./strict-reward-threshold.js";

export function summarizeChallengeExceptionsForThreshold(items: ChallengeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictRewardThresholdsFromException(items: ChallengeException[]): StrictRewardThreshold[] {
  const out: StrictRewardThreshold[] = [];
  for (const item of items) {
    const derived = newStrictRewardThreshold(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeStrictRewardThreshold(item: StrictRewardThreshold): string {
  return classifyChallengeAdjustment(item.measuredValue());
}
