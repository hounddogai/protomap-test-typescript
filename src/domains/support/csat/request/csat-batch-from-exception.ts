import { ticketViewAgreementWeight } from "../../ticket-view/notice/ticket-view-agreement-policy.js";
import { TicketViewException } from "../../ticket-view/notice/ticket-view-exception.js";
import { CsatBatch, newCsatBatch } from "./csat-batch.js";

export function summarizeTicketViewExceptionsForBatch(items: TicketViewException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveCsatBatchesFromException(items: TicketViewException[]): CsatBatch[] {
  const out: CsatBatch[] = [];
  for (const item of items) {
    const derived = newCsatBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveCsatBatch(item: CsatBatch): number {
  return ticketViewAgreementWeight(2, true);
}
