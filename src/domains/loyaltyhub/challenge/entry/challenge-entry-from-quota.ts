import { normalizePrimaryStreakThresholdCode } from "../../streak/streak-quota/primary-streak-threshold-policy.js";
import { SeasonalStreakQuota } from "../../streak/streak-quota/seasonal-streak-quota.js";
import { ChallengeEntry, newChallengeEntry } from "./challenge-entry.js";

export function summarizeSeasonalStreakQuotasForEntry(items: SeasonalStreakQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveChallengeEntriesFromQuota(items: SeasonalStreakQuota[]): ChallengeEntry[] {
  const out: ChallengeEntry[] = [];
  for (const item of items) {
    const derived = newChallengeEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveChallengeEntry(item: ChallengeEntry): string {
  return normalizePrimaryStreakThresholdCode(item.code);
}
