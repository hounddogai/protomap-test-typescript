import {
  normalizeCappedRewardSummaryCode,
} from "../../reward/primary-reward-summary/capped-reward-summary-policy.js";
import { CappedRewardSummary } from "../../reward/primary-reward-summary/capped-reward-summary.js";
import { AdaptiveRedemptionQuota, newAdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

export function summarizeCappedRewardSummariesForQuota(items: CappedRewardSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveAdaptiveRedemptionQuotasFromSummary(items: CappedRewardSummary[]): AdaptiveRedemptionQuota[] {
  const out: AdaptiveRedemptionQuota[] = [];
  for (const item of items) {
    const derived = newAdaptiveRedemptionQuota(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleAdaptiveRedemptionQuota(item: AdaptiveRedemptionQuota): string {
  return normalizeCappedRewardSummaryCode(item.code);
}
