import { CappedStreakPolicy } from "../../streak/snapshot/capped-streak-policy.js";
import { regionalStreakSnapshotBucket } from "../../streak/snapshot/regional-streak-snapshot-policy.js";
import { LenientChallengeScore, newLenientChallengeScore } from "./lenient-challenge-score.js";

export function summarizeCappedStreakPoliciesForScore(items: CappedStreakPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLenientChallengeScoresFromPolicy(items: CappedStreakPolicy[]): LenientChallengeScore[] {
  const out: LenientChallengeScore[] = [];
  for (const item of items) {
    const derived = newLenientChallengeScore(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeLenientChallengeScore(item: LenientChallengeScore): string {
  return regionalStreakSnapshotBucket(item.adjustedTotal());
}
