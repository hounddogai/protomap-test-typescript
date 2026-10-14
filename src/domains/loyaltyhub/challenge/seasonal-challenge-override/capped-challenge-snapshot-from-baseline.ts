import { LenientRewardBaseline } from "../../reward/reward-draft/lenient-reward-baseline.js";
import { classifyLenientRewardScore } from "../../reward/reward-draft/lenient-reward-score-policy.js";
import { CappedChallengeSnapshot, newCappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

export function summarizeLenientRewardBaselinesForSnapshot(items: LenientRewardBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveCappedChallengeSnapshotsFromBaseline(items: LenientRewardBaseline[]): CappedChallengeSnapshot[] {
  const out: CappedChallengeSnapshot[] = [];
  for (const item of items) {
    const derived = newCappedChallengeSnapshot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveCappedChallengeSnapshot(item: CappedChallengeSnapshot): string {
  return classifyLenientRewardScore(item.effectiveVolume());
}
