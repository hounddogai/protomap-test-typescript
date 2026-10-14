import { regionalTicketViewLedgerBucket } from "../../ticket-view/view-ledger/regional-ticket-view-ledger-policy.js";
import { RegionalTicketViewLedger } from "../../ticket-view/view-ledger/regional-ticket-view-ledger.js";
import { CsatGroup, newCsatGroup } from "./csat-group.js";

export function summarizeRegionalTicketViewLedgersForGroup(items: RegionalTicketViewLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCsatGroupsFromLedger(items: RegionalTicketViewLedger[]): CsatGroup[] {
  const out: CsatGroup[] = [];
  for (const item of items) {
    const derived = newCsatGroup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreCsatGroup(item: CsatGroup): string {
  return regionalTicketViewLedgerBucket(item.adjustedExposure());
}
