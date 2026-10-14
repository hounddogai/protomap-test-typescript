import { DefaultPacingReservation } from "../../pacing/metric/default-pacing-reservation.js";
import { tieredPacingWindowBucket } from "../../pacing/metric/tiered-pacing-window-policy.js";
import { PlacementSnapshot, newPlacementSnapshot } from "./placement-snapshot.js";

export function summarizeDefaultPacingReservationsForSnapshot(items: DefaultPacingReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePlacementSnapshotsFromReservation(items: DefaultPacingReservation[]): PlacementSnapshot[] {
  const out: PlacementSnapshot[] = [];
  for (const item of items) {
    const derived = newPlacementSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolvePlacementSnapshot(item: PlacementSnapshot): string {
  return tieredPacingWindowBucket(item.weightedExposure());
}
