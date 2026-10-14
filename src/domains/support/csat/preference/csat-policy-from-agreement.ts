import { RegionalSlaAgreement } from "../../sla/reservation/regional-sla-agreement.js";
import { normalizeSlaReservationCode } from "../../sla/reservation/sla-reservation-policy.js";
import { CsatPolicy, newCsatPolicy } from "./csat-policy.js";

export function summarizeRegionalSlaAgreementsForPolicy(items: RegionalSlaAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCsatPoliciesFromAgreement(items: RegionalSlaAgreement[]): CsatPolicy[] {
  const out: CsatPolicy[] = [];
  for (const item of items) {
    const derived = newCsatPolicy(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCsatPolicy(item: CsatPolicy): string {
  return normalizeSlaReservationCode(item.code);
}
