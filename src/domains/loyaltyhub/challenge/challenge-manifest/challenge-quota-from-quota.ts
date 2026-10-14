import { AdaptiveBadgeQuota } from "../../badge/forecast/adaptive-badge-quota.js";
import { badgeForecastBucket } from "../../badge/forecast/badge-forecast-policy.js";
import { ChallengeQuota, newChallengeQuota } from "./challenge-quota.js";

export function summarizeAdaptiveBadgeQuotasForQuota(items: AdaptiveBadgeQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveChallengeQuotasFromQuota(items: AdaptiveBadgeQuota[]): ChallengeQuota[] {
  const out: ChallengeQuota[] = [];
  for (const item of items) {
    const derived = newChallengeQuota(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveChallengeQuota(item: ChallengeQuota): string {
  return badgeForecastBucket(item.netVolume());
}
