import { ScheduledDomainRequest } from "../audit/scheduled-domain-request.js";
import { seasonalDomainAuditBucket } from "../audit/seasonal-domain-audit-policy.js";
import { TieredDomainLedger, newTieredDomainLedger } from "./tiered-domain-ledger.js";

export function summarizeScheduledDomainRequestsForLedger(items: ScheduledDomainRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredDomainLedgersFromRequest(items: ScheduledDomainRequest[]): TieredDomainLedger[] {
  const out: TieredDomainLedger[] = [];
  for (const item of items) {
    const derived = newTieredDomainLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyTieredDomainLedger(item: TieredDomainLedger): string {
  return seasonalDomainAuditBucket(item.projectedLoad());
}
