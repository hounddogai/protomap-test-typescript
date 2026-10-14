import { seasonalLevelOverrideBucket } from "../../level/override-item/seasonal-level-override-policy.js";
import { SeasonalLevelOverride } from "../../level/override-item/seasonal-level-override.js";
import { BadgeOverride, newBadgeOverride } from "./badge-override.js";

export function summarizeSeasonalLevelOverridesForOverride(items: SeasonalLevelOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveBadgeOverridesFromOverride(items: SeasonalLevelOverride[]): BadgeOverride[] {
  const out: BadgeOverride[] = [];
  for (const item of items) {
    const derived = newBadgeOverride(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBadgeOverride(item: BadgeOverride): string {
  return seasonalLevelOverrideBucket(item.weightedValue());
}
