import { normalizeFallbackPayoutQuotaCode } from "../cycle/fallback-payout-quota-policy.js";
import { FallbackPayoutQuota } from "../cycle/fallback-payout-quota.js";
import { AdaptivePayoutSummary, newAdaptivePayoutSummary } from "./adaptive-payout-summary.js";

export function summarizeFallbackPayoutQuotasForSummary(items: FallbackPayoutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveAdaptivePayoutSummariesFromQuota(items: FallbackPayoutQuota[]): AdaptivePayoutSummary[] {
  const out: AdaptivePayoutSummary[] = [];
  for (const item of items) {
    const derived = newAdaptivePayoutSummary(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptivePayoutSummary(item: AdaptivePayoutSummary): string {
  return normalizeFallbackPayoutQuotaCode(item.code);
}
