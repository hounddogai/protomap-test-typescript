import { AdaptiveCsatRequest } from "../../csat/csat-request/adaptive-csat-request.js";
import { csatCycleBucket } from "../../csat/csat-request/csat-cycle-policy.js";
import { TicketViewLedger, newTicketViewLedger } from "./ticket-view-ledger.js";

export function summarizeAdaptiveCsatRequestsForLedger(items: AdaptiveCsatRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTicketViewLedgersFromRequest(items: AdaptiveCsatRequest[]): TicketViewLedger[] {
  const out: TicketViewLedger[] = [];
  for (const item of items) {
    const derived = newTicketViewLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTicketViewLedger(item: TicketViewLedger): string {
  return csatCycleBucket(item.effectiveLoad());
}
