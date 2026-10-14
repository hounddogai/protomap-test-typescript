import { normalizeGlobalDeflectionRecordCode } from "../../deflection/record-item/global-deflection-record-policy.js";
import { ManualDeflectionReservation } from "../../deflection/record-item/manual-deflection-reservation.js";
import { ManualTicketViewMetric, newManualTicketViewMetric } from "./manual-ticket-view-metric.js";

export function summarizeManualDeflectionReservationsForMetric(items: ManualDeflectionReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveManualTicketViewMetricsFromReservation(items: ManualDeflectionReservation[]): ManualTicketViewMetric[] {
  const out: ManualTicketViewMetric[] = [];
  for (const item of items) {
    const derived = newManualTicketViewMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignManualTicketViewMetric(item: ManualTicketViewMetric): string {
  return normalizeGlobalDeflectionRecordCode(item.code);
}
