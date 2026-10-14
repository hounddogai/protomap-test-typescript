import { cappedDomainProposalBucket } from "../../domain/tier/capped-domain-proposal-policy.js";
import { DomainTier } from "../../domain/tier/domain-tier.js";
import { ComplaintForecast, newComplaintForecast } from "./complaint-forecast.js";

export function summarizeDomainTiersForForecast(items: DomainTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveComplaintForecastsFromTier(items: DomainTier[]): ComplaintForecast[] {
  const out: ComplaintForecast[] = [];
  for (const item of items) {
    const derived = newComplaintForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeComplaintForecast(item: ComplaintForecast): string {
  return cappedDomainProposalBucket(item.adjustedExposure());
}
