import {
  classifyRegionalTicketViewLedger,
} from "../../ticket-view/view-ledger/regional-ticket-view-ledger-policy.js";
import { RegionalTicketViewLedger } from "../../ticket-view/view-ledger/regional-ticket-view-ledger.js";
import { ScheduledMacroSummary, newScheduledMacroSummary } from "./scheduled-macro-summary.js";

export function summarizeRegionalTicketViewLedgersForSummary(items: RegionalTicketViewLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledMacroSummariesFromLedger(items: RegionalTicketViewLedger[]): ScheduledMacroSummary[] {
  const out: ScheduledMacroSummary[] = [];
  for (const item of items) {
    const derived = newScheduledMacroSummary(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeScheduledMacroSummary(item: ScheduledMacroSummary): string {
  return classifyRegionalTicketViewLedger(item.netValue());
}
