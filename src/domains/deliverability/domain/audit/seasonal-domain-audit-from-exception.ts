import { complaintProfileWeight } from "../../complaint/profile/complaint-profile-policy.js";
import { FallbackComplaintException } from "../../complaint/profile/fallback-complaint-exception.js";
import { SeasonalDomainAudit, newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

export function summarizeFallbackComplaintExceptionsForAudit(items: FallbackComplaintException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveSeasonalDomainAuditsFromException(items: FallbackComplaintException[]): SeasonalDomainAudit[] {
  const out: SeasonalDomainAudit[] = [];
  for (const item of items) {
    const derived = newSeasonalDomainAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalDomainAudit(item: SeasonalDomainAudit): number {
  return complaintProfileWeight(2, true);
}
