import { fallbackCreativeWindowBucket } from "../../creative/window/fallback-creative-window-policy.js";
import { FallbackCreativeWindow } from "../../creative/window/fallback-creative-window.js";
import { PlacementReservation, newPlacementReservation } from "./placement-reservation.js";

export function summarizeFallbackCreativeWindowsForReservation(items: FallbackCreativeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function derivePlacementReservationsFromWindow(items: FallbackCreativeWindow[]): PlacementReservation[] {
  const out: PlacementReservation[] = [];
  for (const item of items) {
    const derived = newPlacementReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergePlacementReservation(item: PlacementReservation): string {
  return fallbackCreativeWindowBucket(item.adjustedExposure());
}
