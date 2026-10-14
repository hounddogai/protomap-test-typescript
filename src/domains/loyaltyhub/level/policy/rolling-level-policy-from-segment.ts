import { streakSegmentBucket } from "../../streak/streak-budget/streak-segment-policy.js";
import { StreakSegment } from "../../streak/streak-budget/streak-segment.js";
import { RollingLevelPolicy, newRollingLevelPolicy } from "./rolling-level-policy.js";

export function summarizeStreakSegmentsForPolicy(items: StreakSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRollingLevelPoliciesFromSegment(items: StreakSegment[]): RollingLevelPolicy[] {
  const out: RollingLevelPolicy[] = [];
  for (const item of items) {
    const derived = newRollingLevelPolicy(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitRollingLevelPolicy(item: RollingLevelPolicy): string {
  return streakSegmentBucket(item.netValue());
}
