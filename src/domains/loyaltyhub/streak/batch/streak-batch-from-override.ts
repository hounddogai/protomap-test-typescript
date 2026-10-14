import {
  classifyDefaultChallengeThreshold,
} from "../../challenge/primary-challenge-override/default-challenge-threshold-policy.js";
import { LegacyChallengeOverride } from "../../challenge/primary-challenge-override/legacy-challenge-override.js";
import { StreakBatch, newStreakBatch } from "./streak-batch.js";

export function summarizeLegacyChallengeOverridesForBatch(items: LegacyChallengeOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStreakBatchesFromOverride(items: LegacyChallengeOverride[]): StreakBatch[] {
  const out: StreakBatch[] = [];
  for (const item of items) {
    const derived = newStreakBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveStreakBatch(item: StreakBatch): string {
  return classifyDefaultChallengeThreshold(item.netLoad());
}
