import { pendingFlightMetricBucket } from "../../flight/metric/pending-flight-metric-policy.js";
import { PendingFlightMetric } from "../../flight/metric/pending-flight-metric.js";
import { ManualPacingReservation, newManualPacingReservation } from "./manual-pacing-reservation.js";

export function summarizePendingFlightMetricsForReservation(items: PendingFlightMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveManualPacingReservationsFromMetric(items: PendingFlightMetric[]): ManualPacingReservation[] {
  const out: ManualPacingReservation[] = [];
  for (const item of items) {
    const derived = newManualPacingReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchManualPacingReservationExtra(item: ManualPacingReservation): string {
  return pendingFlightMetricBucket(item.effectiveValue());
}
