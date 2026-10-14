import { cappedSlaLedgerBucket } from "../../sla/agreement/capped-sla-ledger-policy.js";
import { PendingSlaForecast } from "../../sla/agreement/pending-sla-forecast.js";
import { LegacyTicketViewSummary, newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

export function summarizePendingSlaForecastsForSummary(items: PendingSlaForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveLegacyTicketViewSummariesFromForecast(items: PendingSlaForecast[]): LegacyTicketViewSummary[] {
  const out: LegacyTicketViewSummary[] = [];
  for (const item of items) {
    const derived = newLegacyTicketViewSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLegacyTicketViewSummary(item: LegacyTicketViewSummary): string {
  return cappedSlaLedgerBucket(item.adjustedExposure());
}
