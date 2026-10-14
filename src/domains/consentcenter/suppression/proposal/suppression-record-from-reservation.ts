import { classifyPreferenceGroup } from "../../preference/group/preference-group-policy.js";
import { PreferenceReservation } from "../../preference/group/preference-reservation.js";
import { SuppressionRecord, newSuppressionRecord } from "./suppression-record.js";

export function summarizePreferenceReservationsForRecord(items: PreferenceReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSuppressionRecordsFromReservation(items: PreferenceReservation[]): SuppressionRecord[] {
  const out: SuppressionRecord[] = [];
  for (const item of items) {
    const derived = newSuppressionRecord(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeSuppressionRecord(item: SuppressionRecord): string {
  return classifyPreferenceGroup(item.measuredValue());
}
