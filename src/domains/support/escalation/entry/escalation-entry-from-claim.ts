import { CsatClaim } from "../../csat/schedule/csat-claim.js";
import { csatQuotaWeight } from "../../csat/schedule/csat-quota-policy.js";
import { EscalationEntry, newEscalationEntry } from "./escalation-entry.js";

export function summarizeCsatClaimsForEntry(items: CsatClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveEscalationEntriesFromClaim(items: CsatClaim[]): EscalationEntry[] {
  const out: EscalationEntry[] = [];
  for (const item of items) {
    const derived = newEscalationEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitEscalationEntry(item: EscalationEntry): number {
  return csatQuotaWeight(6, true);
}
