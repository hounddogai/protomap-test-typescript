import { PendingTicketViewAudit } from "../view-ledger/pending-ticket-view-audit.js";
import { regionalTicketViewLedgerBucket } from "../view-ledger/regional-ticket-view-ledger-policy.js";
import { BatchedTicketViewThreshold, newBatchedTicketViewThreshold } from "./batched-ticket-view-threshold.js";

export function summarizePendingTicketViewAuditsForThreshold(items: PendingTicketViewAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBatchedTicketViewThresholdsFromAudit(items: PendingTicketViewAudit[]): BatchedTicketViewThreshold[] {
  const out: BatchedTicketViewThreshold[] = [];
  for (const item of items) {
    const derived = newBatchedTicketViewThreshold(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyBatchedTicketViewThreshold(item: BatchedTicketViewThreshold): string {
  return regionalTicketViewLedgerBucket(item.adjustedLoad());
}
