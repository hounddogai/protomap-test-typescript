import { ManualStreakAgreement } from "../../streak/tier/manual-streak-agreement.js";
import { streakTierBucket } from "../../streak/tier/streak-tier-policy.js";
import { WeightedChallengeSnapshot, newWeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

export function summarizeManualStreakAgreementsForSnapshot(items: ManualStreakAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveWeightedChallengeSnapshotsFromAgreement(items: ManualStreakAgreement[]): WeightedChallengeSnapshot[] {
  const out: WeightedChallengeSnapshot[] = [];
  for (const item of items) {
    const derived = newWeightedChallengeSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleWeightedChallengeSnapshot(item: WeightedChallengeSnapshot): string {
  return streakTierBucket(item.adjustedVolume());
}
