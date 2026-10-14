import { LegacyChallengePreference } from "../../challenge/plan/legacy-challenge-preference.js";
import { regionalChallengeCycleBucket } from "../../challenge/plan/regional-challenge-cycle-policy.js";
import { SeasonalRedemptionThreshold, newSeasonalRedemptionThreshold } from "./seasonal-redemption-threshold.js";

export function summarizeLegacyChallengePreferencesForThreshold(items: LegacyChallengePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSeasonalRedemptionThresholdsFromPreference(items: LegacyChallengePreference[]): SeasonalRedemptionThreshold[] {
  const out: SeasonalRedemptionThreshold[] = [];
  for (const item of items) {
    const derived = newSeasonalRedemptionThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitSeasonalRedemptionThreshold(item: SeasonalRedemptionThreshold): string {
  return regionalChallengeCycleBucket(item.effectiveValue());
}
