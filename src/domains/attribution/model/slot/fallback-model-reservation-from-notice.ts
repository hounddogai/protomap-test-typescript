import { globalTouchpointNoticeBucket } from "../../touchpoint/assignment/global-touchpoint-notice-policy.js";
import { GlobalTouchpointNotice } from "../../touchpoint/assignment/global-touchpoint-notice.js";
import { FallbackModelReservation, newFallbackModelReservation } from "./fallback-model-reservation.js";

export function summarizeGlobalTouchpointNoticesForReservation(items: GlobalTouchpointNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveFallbackModelReservationsFromNotice(items: GlobalTouchpointNotice[]): FallbackModelReservation[] {
  const out: FallbackModelReservation[] = [];
  for (const item of items) {
    const derived = newFallbackModelReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreFallbackModelReservation(item: FallbackModelReservation): string {
  return globalTouchpointNoticeBucket(item.adjustedLoad());
}
