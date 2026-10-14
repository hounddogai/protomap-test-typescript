import { ScheduledTouchpointQuota } from "../../touchpoint/quota/scheduled-touchpoint-quota.js";
import { touchpointBatchWeight } from "../../touchpoint/quota/touchpoint-batch-policy.js";
import { DefaultModelReservation, newDefaultModelReservation } from "./default-model-reservation.js";

export function summarizeScheduledTouchpointQuotasForReservation(items: ScheduledTouchpointQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDefaultModelReservationsFromQuota(items: ScheduledTouchpointQuota[]): DefaultModelReservation[] {
  const out: DefaultModelReservation[] = [];
  for (const item of items) {
    const derived = newDefaultModelReservation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeDefaultModelReservation(item: DefaultModelReservation): number {
  return touchpointBatchWeight(7, true);
}
