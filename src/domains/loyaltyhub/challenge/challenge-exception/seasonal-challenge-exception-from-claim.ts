import { normalizeSeasonalStreakPolicyCode } from "../../streak/streak-profile/seasonal-streak-policy-policy.js";
import { TieredStreakClaim } from "../../streak/streak-profile/tiered-streak-claim.js";
import { SeasonalChallengeException, newSeasonalChallengeException } from "./seasonal-challenge-exception.js";

export function summarizeTieredStreakClaimsForException(items: TieredStreakClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSeasonalChallengeExceptionsFromClaim(items: TieredStreakClaim[]): SeasonalChallengeException[] {
  const out: SeasonalChallengeException[] = [];
  for (const item of items) {
    const derived = newSeasonalChallengeException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeSeasonalChallengeException(item: SeasonalChallengeException): string {
  return normalizeSeasonalStreakPolicyCode(item.code);
}
