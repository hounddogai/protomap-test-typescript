import { challengeSlotBucket } from "../override-item/challenge-slot-policy.js";
import { ChallengeThreshold } from "../override-item/challenge-threshold.js";
import { PrimaryChallengeManifest, newPrimaryChallengeManifest } from "./primary-challenge-manifest.js";

export function summarizeChallengeThresholdsForManifest(items: ChallengeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryChallengeManifestsFromThreshold(items: ChallengeThreshold[]): PrimaryChallengeManifest[] {
  const out: PrimaryChallengeManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryChallengeManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryChallengeManifest(item: PrimaryChallengeManifest): string {
  return challengeSlotBucket(item.projectedLoad());
}
