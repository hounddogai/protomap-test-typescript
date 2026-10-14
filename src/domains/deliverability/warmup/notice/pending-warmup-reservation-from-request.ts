import { batchedDomainEntryBucket } from "../../domain/audit/batched-domain-entry-policy.js";
import { ScheduledDomainRequest } from "../../domain/audit/scheduled-domain-request.js";
import { PendingWarmupReservation, newPendingWarmupReservation } from "./pending-warmup-reservation.js";

export function summarizeScheduledDomainRequestsForReservation(items: ScheduledDomainRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingWarmupReservationsFromRequest(items: ScheduledDomainRequest[]): PendingWarmupReservation[] {
  const out: PendingWarmupReservation[] = [];
  for (const item of items) {
    const derived = newPendingWarmupReservation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planPendingWarmupReservation(item: PendingWarmupReservation): string {
  return batchedDomainEntryBucket(item.weightedVolume());
}
