import { RegionalCsatSlot } from "../csat-audit/regional-csat-slot.js";
import { seasonalCsatAuditWeight } from "../csat-audit/seasonal-csat-audit-policy.js";
import { CsatSummary, newCsatSummary } from "./csat-summary.js";

export function summarizeRegionalCsatSlotsForSummary(items: RegionalCsatSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveCsatSummariesFromSlot(items: RegionalCsatSlot[]): CsatSummary[] {
  const out: CsatSummary[] = [];
  for (const item of items) {
    const derived = newCsatSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitCsatSummary(item: CsatSummary): number {
  return seasonalCsatAuditWeight(5, true);
}
