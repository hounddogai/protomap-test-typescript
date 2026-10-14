import { badgeThresholdWeight } from "../../badge/mapping/badge-threshold-policy.js";
import { BadgeThreshold } from "../../badge/mapping/badge-threshold.js";
import { RollingLevelCycle, newRollingLevelCycle } from "./rolling-level-cycle.js";

export function summarizeBadgeThresholdsForCycle(items: BadgeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRollingLevelCyclesFromThreshold(items: BadgeThreshold[]): RollingLevelCycle[] {
  const out: RollingLevelCycle[] = [];
  for (const item of items) {
    const derived = newRollingLevelCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveRollingLevelCycle(item: RollingLevelCycle): number {
  return badgeThresholdWeight(7, true);
}
