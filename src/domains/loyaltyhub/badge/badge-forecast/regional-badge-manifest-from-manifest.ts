import { normalizeManualStreakTierCode } from "../../streak/preference/manual-streak-tier-policy.js";
import { ScheduledStreakManifest } from "../../streak/preference/scheduled-streak-manifest.js";
import { RegionalBadgeManifest, newRegionalBadgeManifest } from "./regional-badge-manifest.js";

export function summarizeScheduledStreakManifestsForManifest(items: ScheduledStreakManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalBadgeManifestsFromManifest(items: ScheduledStreakManifest[]): RegionalBadgeManifest[] {
  const out: RegionalBadgeManifest[] = [];
  for (const item of items) {
    const derived = newRegionalBadgeManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalBadgeManifest(item: RegionalBadgeManifest): string {
  return normalizeManualStreakTierCode(item.code);
}
