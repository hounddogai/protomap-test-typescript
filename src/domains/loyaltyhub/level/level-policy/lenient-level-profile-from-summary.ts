import { BatchedChallengeSummary } from "../../challenge/adaptive-challenge-manifest/batched-challenge-summary.js";
import {
  globalChallengeManifestBucket,
} from "../../challenge/adaptive-challenge-manifest/global-challenge-manifest-policy.js";
import { LenientLevelProfile, newLenientLevelProfile } from "./lenient-level-profile.js";

export function summarizeBatchedChallengeSummariesForProfile(items: BatchedChallengeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientLevelProfilesFromSummary(items: BatchedChallengeSummary[]): LenientLevelProfile[] {
  const out: LenientLevelProfile[] = [];
  for (const item of items) {
    const derived = newLenientLevelProfile(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateLenientLevelProfile(item: LenientLevelProfile): string {
  return globalChallengeManifestBucket(item.measuredValue());
}
