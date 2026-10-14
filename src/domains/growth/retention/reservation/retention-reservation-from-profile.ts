import { FunnelProfile } from "../../funnel/manifest/funnel-profile.js";
import { funnelSlotBucket } from "../../funnel/manifest/funnel-slot-policy.js";
import { RetentionReservation, newRetentionReservation } from "./retention-reservation.js";

export function summarizeFunnelProfilesForReservation(items: FunnelProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRetentionReservationsFromProfile(items: FunnelProfile[]): RetentionReservation[] {
  const out: RetentionReservation[] = [];
  for (const item of items) {
    const derived = newRetentionReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileRetentionReservation(item: RetentionReservation): string {
  return funnelSlotBucket(item.measuredValue());
}
