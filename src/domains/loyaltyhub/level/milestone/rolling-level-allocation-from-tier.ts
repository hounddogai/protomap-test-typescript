import { classifyAdaptiveBadgeWindow } from "../../badge/tier/adaptive-badge-window-policy.js";
import { DefaultBadgeTier } from "../../badge/tier/default-badge-tier.js";
import { RollingLevelAllocation, newRollingLevelAllocation } from "./rolling-level-allocation.js";

export function summarizeDefaultBadgeTiersForAllocation(items: DefaultBadgeTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRollingLevelAllocationsFromTier(items: DefaultBadgeTier[]): RollingLevelAllocation[] {
  const out: RollingLevelAllocation[] = [];
  for (const item of items) {
    const derived = newRollingLevelAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRollingLevelAllocation(item: RollingLevelAllocation): string {
  return classifyAdaptiveBadgeWindow(item.effectiveExposure());
}
