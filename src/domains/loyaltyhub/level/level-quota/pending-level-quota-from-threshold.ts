import { fallbackStreakTargetBucket } from "../../streak/reservation/fallback-streak-target-policy.js";
import { LegacyStreakThreshold } from "../../streak/reservation/legacy-streak-threshold.js";
import { PendingLevelQuota, newPendingLevelQuota } from "./pending-level-quota.js";

export function summarizeLegacyStreakThresholdsForQuota(items: LegacyStreakThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePendingLevelQuotasFromThreshold(items: LegacyStreakThreshold[]): PendingLevelQuota[] {
  const out: PendingLevelQuota[] = [];
  for (const item of items) {
    const derived = newPendingLevelQuota(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocatePendingLevelQuota(item: PendingLevelQuota): string {
  return fallbackStreakTargetBucket(item.measuredValue());
}
