import { globalRewardSummaryWeight } from "../../reward/reward-entry/global-reward-summary-policy.js";
import { ScheduledRewardTarget } from "../../reward/reward-entry/scheduled-reward-target.js";
import { LenientRedemptionQuota, newLenientRedemptionQuota } from "./lenient-redemption-quota.js";

export function summarizeScheduledRewardTargetsForQuota(items: ScheduledRewardTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLenientRedemptionQuotasFromTarget(items: ScheduledRewardTarget[]): LenientRedemptionQuota[] {
  const out: LenientRedemptionQuota[] = [];
  for (const item of items) {
    const derived = newLenientRedemptionQuota(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLenientRedemptionQuota(item: LenientRedemptionQuota): number {
  return globalRewardSummaryWeight(6, true);
}
