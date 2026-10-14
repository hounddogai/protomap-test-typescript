import { classifyCappedPostReservation } from "../../post/post-quota/capped-post-reservation-policy.js";
import { CappedPostReservation } from "../../post/post-quota/capped-post-reservation.js";
import { BatchedQueueProposal, newBatchedQueueProposal } from "./batched-queue-proposal.js";

export function summarizeCappedPostReservationsForProposal(items: CappedPostReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBatchedQueueProposalsFromReservation(items: CappedPostReservation[]): BatchedQueueProposal[] {
  const out: BatchedQueueProposal[] = [];
  for (const item of items) {
    const derived = newBatchedQueueProposal(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedQueueProposal(item: BatchedQueueProposal): string {
  return classifyCappedPostReservation(item.weightedLoad());
}
