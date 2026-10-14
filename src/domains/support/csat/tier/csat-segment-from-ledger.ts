import { cappedSlaQuotaWeight } from "../../sla/sla-audit/capped-sla-quota-policy.js";
import { LegacySlaLedger } from "../../sla/sla-audit/legacy-sla-ledger.js";
import { CsatSegment, newCsatSegment } from "./csat-segment.js";

export function summarizeLegacySlaLedgersForSegment(items: LegacySlaLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveCsatSegmentsFromLedger(items: LegacySlaLedger[]): CsatSegment[] {
  const out: CsatSegment[] = [];
  for (const item of items) {
    const derived = newCsatSegment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitCsatSegment(item: CsatSegment): number {
  return cappedSlaQuotaWeight(3, true);
}
