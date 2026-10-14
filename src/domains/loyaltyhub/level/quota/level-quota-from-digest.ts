import { streakDigestBucket } from "../../streak/digest/streak-digest-policy.js";
import { StreakDigest } from "../../streak/digest/streak-digest.js";
import { LevelQuota, newLevelQuota } from "./level-quota.js";

export function summarizeStreakDigestsForQuota(items: StreakDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLevelQuotasFromDigest(items: StreakDigest[]): LevelQuota[] {
  const out: LevelQuota[] = [];
  for (const item of items) {
    const derived = newLevelQuota(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveLevelQuota(item: LevelQuota): string {
  return streakDigestBucket(item.measuredValue());
}
