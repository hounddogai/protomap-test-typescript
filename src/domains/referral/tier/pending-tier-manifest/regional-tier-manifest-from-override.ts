import {
  normalizeScheduledLeaderboardOverrideCode,
} from "../../leaderboard/override-item/scheduled-leaderboard-override-policy.js";
import { ScheduledLeaderboardOverride } from "../../leaderboard/override-item/scheduled-leaderboard-override.js";
import { RegionalTierManifest, newRegionalTierManifest } from "./regional-tier-manifest.js";

export function summarizeScheduledLeaderboardOverridesForManifest(items: ScheduledLeaderboardOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveRegionalTierManifestsFromOverride(items: ScheduledLeaderboardOverride[]): RegionalTierManifest[] {
  const out: RegionalTierManifest[] = [];
  for (const item of items) {
    const derived = newRegionalTierManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRegionalTierManifest(item: RegionalTierManifest): string {
  return normalizeScheduledLeaderboardOverrideCode(item.code);
}
