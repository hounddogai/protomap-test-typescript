import { PrimaryTierForecast } from "../../tier/segment/primary-tier-forecast.js";
import { normalizeStrictTierDraftCode } from "../../tier/segment/strict-tier-draft-policy.js";
import { StrictLeaderboardAllocation, newStrictLeaderboardAllocation } from "./strict-leaderboard-allocation.js";

export function summarizePrimaryTierForecastsForAllocation(items: PrimaryTierForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveStrictLeaderboardAllocationsFromForecast(items: PrimaryTierForecast[]): StrictLeaderboardAllocation[] {
  const out: StrictLeaderboardAllocation[] = [];
  for (const item of items) {
    const derived = newStrictLeaderboardAllocation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateStrictLeaderboardAllocation(item: StrictLeaderboardAllocation): string {
  return normalizeStrictTierDraftCode(item.code);
}
