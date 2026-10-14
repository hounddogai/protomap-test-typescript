import { bounceProfileBucket } from "../../bounce/profile/bounce-profile-policy.js";
import { BounceProfile } from "../../bounce/profile/bounce-profile.js";
import { LegacyReputationQuota, newLegacyReputationQuota } from "./legacy-reputation-quota.js";

export function summarizeBounceProfilesForQuota(items: BounceProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLegacyReputationQuotasFromProfile(items: BounceProfile[]): LegacyReputationQuota[] {
  const out: LegacyReputationQuota[] = [];
  for (const item of items) {
    const derived = newLegacyReputationQuota(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignLegacyReputationQuota(item: LegacyReputationQuota): string {
  return bounceProfileBucket(item.effectiveExposure());
}
