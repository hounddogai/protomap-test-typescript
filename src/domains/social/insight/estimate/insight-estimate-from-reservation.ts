import { normalizeQueueAdjustmentCode } from "../../queue/reservation/queue-adjustment-policy.js";
import { QueueReservation } from "../../queue/reservation/queue-reservation.js";
import { InsightEstimate, newInsightEstimate } from "./insight-estimate.js";

export function summarizeQueueReservationsForEstimate(items: QueueReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveInsightEstimatesFromReservation(items: QueueReservation[]): InsightEstimate[] {
  const out: InsightEstimate[] = [];
  for (const item of items) {
    const derived = newInsightEstimate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreInsightEstimate(item: InsightEstimate): string {
  return normalizeQueueAdjustmentCode(item.code);
}
