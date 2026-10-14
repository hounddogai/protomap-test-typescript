import { scheduledDomainTierBucket } from "../../domain/weighted-domain-schedule/scheduled-domain-tier-policy.js";
import { ScheduledDomainTier } from "../../domain/weighted-domain-schedule/scheduled-domain-tier.js";
import { PrimarySenderSummary, newPrimarySenderSummary } from "./primary-sender-summary.js";

export function summarizeScheduledDomainTiersForSummary(items: ScheduledDomainTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimarySenderSummariesFromTier(items: ScheduledDomainTier[]): PrimarySenderSummary[] {
  const out: PrimarySenderSummary[] = [];
  for (const item of items) {
    const derived = newPrimarySenderSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergePrimarySenderSummary(item: PrimarySenderSummary): string {
  return scheduledDomainTierBucket(item.netLoad());
}
