import { QueueLedger } from "../../queue/draft/queue-ledger.js";
import { queueProfileBucket } from "../../queue/draft/queue-profile-policy.js";
import { AdaptiveReplyReservation, newAdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

export function summarizeQueueLedgersForReservation(items: QueueLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveReplyReservationsFromLedger(items: QueueLedger[]): AdaptiveReplyReservation[] {
  const out: AdaptiveReplyReservation[] = [];
  for (const item of items) {
    const derived = newAdaptiveReplyReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveReplyReservationExtra(item: AdaptiveReplyReservation): string {
  return queueProfileBucket(item.measuredValue());
}
