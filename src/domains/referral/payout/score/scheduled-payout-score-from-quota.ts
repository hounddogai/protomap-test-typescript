import { normalizeCappedPayoutQuotaCode } from "../preference/capped-payout-quota-policy.js";
import { CappedPayoutQuota } from "../preference/capped-payout-quota.js";
import { ScheduledPayoutScore, newScheduledPayoutScore } from "./scheduled-payout-score.js";

export function summarizeCappedPayoutQuotasForScore(items: CappedPayoutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveScheduledPayoutScoresFromQuota(items: CappedPayoutQuota[]): ScheduledPayoutScore[] {
  const out: ScheduledPayoutScore[] = [];
  for (const item of items) {
    const derived = newScheduledPayoutScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleScheduledPayoutScore(item: ScheduledPayoutScore): string {
  return normalizeCappedPayoutQuotaCode(item.code);
}
