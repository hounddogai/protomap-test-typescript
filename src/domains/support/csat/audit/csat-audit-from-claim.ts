import { adaptiveCsatTargetWeight } from "../csat-proposal/adaptive-csat-target-policy.js";
import { RegionalCsatClaim } from "../csat-proposal/regional-csat-claim.js";
import { CsatAudit, newCsatAudit } from "./csat-audit.js";

export function summarizeRegionalCsatClaimsForAudit(items: RegionalCsatClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveCsatAuditsFromClaim(items: RegionalCsatClaim[]): CsatAudit[] {
  const out: CsatAudit[] = [];
  for (const item of items) {
    const derived = newCsatAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleCsatAudit(item: CsatAudit): number {
  return adaptiveCsatTargetWeight(6, true);
}
