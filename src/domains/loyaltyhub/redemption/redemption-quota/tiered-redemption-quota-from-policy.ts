import { RedemptionPolicy } from "../redemption-summary/redemption-policy.js";
import { seasonalRedemptionSummaryBucket } from "../redemption-summary/seasonal-redemption-summary-policy.js";
import { TieredRedemptionQuota, newTieredRedemptionQuota } from "./tiered-redemption-quota.js";

export function summarizeRedemptionPoliciesForQuota(items: RedemptionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredRedemptionQuotasFromPolicy(items: RedemptionPolicy[]): TieredRedemptionQuota[] {
  const out: TieredRedemptionQuota[] = [];
  for (const item of items) {
    const derived = newTieredRedemptionQuota(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyTieredRedemptionQuota(item: TieredRedemptionQuota): string {
  return seasonalRedemptionSummaryBucket(item.effectiveVolume());
}
