import { normalizeInsightOverrideCode } from "../slot/insight-override-policy.js";
import { InsightReservation } from "../slot/insight-reservation.js";
import { ManualInsightAdjustment, newManualInsightAdjustment } from "./manual-insight-adjustment.js";

export function summarizeInsightReservationsForAdjustment(items: InsightReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveManualInsightAdjustmentsFromReservation(items: InsightReservation[]): ManualInsightAdjustment[] {
  const out: ManualInsightAdjustment[] = [];
  for (const item of items) {
    const derived = newManualInsightAdjustment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankManualInsightAdjustment(item: ManualInsightAdjustment): string {
  return normalizeInsightOverrideCode(item.code);
}
