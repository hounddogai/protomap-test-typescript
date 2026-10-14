import { ScheduledTicketViewScore } from "../../ticket-view/slot/scheduled-ticket-view-score.js";
import { ticketViewSummaryWeight } from "../../ticket-view/slot/ticket-view-summary-policy.js";
import { CsatAgreement, newCsatAgreement } from "./csat-agreement.js";

export function summarizeScheduledTicketViewScoresForAgreement(items: ScheduledTicketViewScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveCsatAgreementsFromScore(items: ScheduledTicketViewScore[]): CsatAgreement[] {
  const out: CsatAgreement[] = [];
  for (const item of items) {
    const derived = newCsatAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeCsatAgreement(item: CsatAgreement): number {
  return ticketViewSummaryWeight(7, true);
}
