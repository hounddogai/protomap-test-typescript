import { FallbackLeaderboardPolicy } from "../../leaderboard/policy/fallback-leaderboard-policy.js";
import {
  normalizeSeasonalLeaderboardAgreementCode,
} from "../../leaderboard/policy/seasonal-leaderboard-agreement-policy.js";
import { TierBatch, newTierBatch } from "./tier-batch.js";

export function summarizeFallbackLeaderboardPoliciesForBatch(items: FallbackLeaderboardPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveTierBatchesFromPolicy(items: FallbackLeaderboardPolicy[]): TierBatch[] {
  const out: TierBatch[] = [];
  for (const item of items) {
    const derived = newTierBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTierBatch(item: TierBatch): string {
  return normalizeSeasonalLeaderboardAgreementCode(item.code);
}
