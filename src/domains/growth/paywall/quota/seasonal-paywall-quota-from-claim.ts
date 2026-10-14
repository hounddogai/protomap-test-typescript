import { LegacyCohortClaim } from "../../cohort/claim/legacy-cohort-claim.js";
import { normalizePrimaryCohortRollupCode } from "../../cohort/claim/primary-cohort-rollup-policy.js";
import { SeasonalPaywallQuota, newSeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

export function summarizeLegacyCohortClaimsForQuota(items: LegacyCohortClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSeasonalPaywallQuotasFromClaim(items: LegacyCohortClaim[]): SeasonalPaywallQuota[] {
  const out: SeasonalPaywallQuota[] = [];
  for (const item of items) {
    const derived = newSeasonalPaywallQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalPaywallQuota(item: SeasonalPaywallQuota): string {
  return normalizePrimaryCohortRollupCode(item.code);
}
