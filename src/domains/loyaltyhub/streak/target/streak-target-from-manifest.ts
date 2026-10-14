import { StreakManifest } from "../budget/streak-manifest.js";
import { streakProposalBucket } from "../budget/streak-proposal-policy.js";
import { StreakTarget, newStreakTarget } from "./streak-target.js";

export function summarizeStreakManifestsForTarget(items: StreakManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStreakTargetsFromManifest(items: StreakManifest[]): StreakTarget[] {
  const out: StreakTarget[] = [];
  for (const item of items) {
    const derived = newStreakTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchStreakTarget(item: StreakTarget): string {
  return streakProposalBucket(item.adjustedLoad());
}
