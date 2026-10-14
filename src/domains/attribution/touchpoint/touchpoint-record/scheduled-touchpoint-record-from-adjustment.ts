import { DefaultPathAdjustment } from "../../path/fallback-path-adjustment/default-path-adjustment.js";
import { scheduledPathForecastWeight } from "../../path/fallback-path-adjustment/scheduled-path-forecast-policy.js";
import { ScheduledTouchpointRecord, newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

export function summarizeDefaultPathAdjustmentsForRecord(items: DefaultPathAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveScheduledTouchpointRecordsFromAdjustment(items: DefaultPathAdjustment[]): ScheduledTouchpointRecord[] {
  const out: ScheduledTouchpointRecord[] = [];
  for (const item of items) {
    const derived = newScheduledTouchpointRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveScheduledTouchpointRecord(item: ScheduledTouchpointRecord): number {
  return scheduledPathForecastWeight(9, true);
}
