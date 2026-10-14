import { challengeCycleWeight } from "../challenge-manifest/challenge-cycle-policy.js";
import { DefaultChallengeManifest } from "../challenge-manifest/default-challenge-manifest.js";
import { ChallengeThreshold, newChallengeThreshold } from "./challenge-threshold.js";

export function summarizeDefaultChallengeManifestsForThreshold(items: DefaultChallengeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveChallengeThresholdsFromManifest(items: DefaultChallengeManifest[]): ChallengeThreshold[] {
  const out: ChallengeThreshold[] = [];
  for (const item of items) {
    const derived = newChallengeThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateChallengeThreshold(item: ChallengeThreshold): number {
  return challengeCycleWeight(6, true);
}
