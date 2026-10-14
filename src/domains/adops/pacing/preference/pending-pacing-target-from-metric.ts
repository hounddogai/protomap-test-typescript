import { RollingFlightMetric } from "../../flight/ledger/rolling-flight-metric.js";
import { normalizeScheduledFlightSlotCode } from "../../flight/ledger/scheduled-flight-slot-policy.js";
import { PendingPacingTarget, newPendingPacingTarget } from "./pending-pacing-target.js";

export function summarizeRollingFlightMetricsForTarget(items: RollingFlightMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePendingPacingTargetsFromMetric(items: RollingFlightMetric[]): PendingPacingTarget[] {
  const out: PendingPacingTarget[] = [];
  for (const item of items) {
    const derived = newPendingPacingTarget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimatePendingPacingTarget(item: PendingPacingTarget): string {
  return normalizeScheduledFlightSlotCode(item.code);
}
