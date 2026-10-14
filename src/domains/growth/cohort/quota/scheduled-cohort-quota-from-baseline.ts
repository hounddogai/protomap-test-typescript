import { paywallAllocationBucket } from "../../paywall/baseline/paywall-allocation-policy.js";
import { PaywallBaseline } from "../../paywall/baseline/paywall-baseline.js";
import { ScheduledCohortQuota, newScheduledCohortQuota } from "./scheduled-cohort-quota.js";

export function summarizePaywallBaselinesForQuota(items: PaywallBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveScheduledCohortQuotasFromBaseline(items: PaywallBaseline[]): ScheduledCohortQuota[] {
  const out: ScheduledCohortQuota[] = [];
  for (const item of items) {
    const derived = newScheduledCohortQuota(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleScheduledCohortQuota(item: ScheduledCohortQuota): string {
  return paywallAllocationBucket(item.measuredValue());
}
