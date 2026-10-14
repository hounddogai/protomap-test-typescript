import { classifyCappedBadgeDigest } from "../../badge/window/capped-badge-digest-policy.js";
import { PrimaryBadgeWindow } from "../../badge/window/primary-badge-window.js";
import { WeightedStreakCycle, newWeightedStreakCycle } from "./weighted-streak-cycle.js";

export function summarizePrimaryBadgeWindowsForCycle(items: PrimaryBadgeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedStreakCyclesFromWindow(items: PrimaryBadgeWindow[]): WeightedStreakCycle[] {
  const out: WeightedStreakCycle[] = [];
  for (const item of items) {
    const derived = newWeightedStreakCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignWeightedStreakCycle(item: WeightedStreakCycle): string {
  return classifyCappedBadgeDigest(item.netVolume());
}
