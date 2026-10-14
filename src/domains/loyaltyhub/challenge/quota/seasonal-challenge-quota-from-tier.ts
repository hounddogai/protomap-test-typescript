import { normalizeLenientRedemptionTierCode } from "../../redemption/tier/lenient-redemption-tier-policy.js";
import { LenientRedemptionTier } from "../../redemption/tier/lenient-redemption-tier.js";
import { SeasonalChallengeQuota, newSeasonalChallengeQuota } from "./seasonal-challenge-quota.js";

export function summarizeLenientRedemptionTiersForQuota(items: LenientRedemptionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalChallengeQuotasFromTier(items: LenientRedemptionTier[]): SeasonalChallengeQuota[] {
  const out: SeasonalChallengeQuota[] = [];
  for (const item of items) {
    const derived = newSeasonalChallengeQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeSeasonalChallengeQuota(item: SeasonalChallengeQuota): string {
  return normalizeLenientRedemptionTierCode(item.code);
}
